import BigNumber from 'bignumber.js';
import { NumericAmount, Price, SqrtPrice } from '../types/amounts.js';
import type {
  QuoteExactAmountRawResponse,
  QuoteExactAmountResponse,
} from '../types/api_responses.js';
import { FEE_TIER } from '../types/fees.js';
import type { GetQuoteResult } from '../types/sdk_results.js';
import type { GalaChainTokenClassKey } from '../types/token.js';
import { getTokenOrdering, parseTokenClassKey } from '../utils/token.js';
import { validateNumericAmount } from '../utils/validation.js';
import { GSwapSDKError } from './gswap_sdk_error.js';
import { HttpClient } from './http_client.js';

/**
 * Handles quote operations for token swaps.
 */
export class Quoting {
  private readonly httpClient: HttpClient;

  constructor(
    private readonly gatewayBaseUrl: string,
    private readonly dexContractBasePath: string,
    httpClient?: HttpClient,
  ) {
    this.httpClient = httpClient ?? new HttpClient();
  }

  /**
   * Gets a quote for an exact amount of token being sold.
   * @param tokenIn - The input token to sell.
   * @param tokenOut - The output token to buy.
   * @param amountIn - The exact amount of input tokens you want to sell.
   * @param fee - The pool fee tier. If not specified, will check all available fee tiers and return the best quote.
   * @returns The expected number of tokens you will receive (buy) when/if you execute the swap.
   */
  async quoteExactInput(
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    amountIn: NumericAmount,
    fee?: FEE_TIER,
  ): Promise<GetQuoteResult> {
    validateNumericAmount(amountIn, 'amountIn');

    if (fee !== undefined) {
      // Get quote from specific fee tier
      const result = await this.getSingleQuoteExactInput(tokenIn, tokenOut, fee, amountIn);
      return result;
    }

    // Get quotes from all fee tiers and return the best one
    const allFees = [FEE_TIER.PERCENT_00_05, FEE_TIER.PERCENT_00_30, FEE_TIER.PERCENT_01_00];

    const quotePromises = allFees.map(async (feeTier) => {
      try {
        return await this.getSingleQuoteExactInput(tokenIn, tokenOut, feeTier, amountIn);
      } catch (err) {
        if (
          err instanceof GSwapSDKError &&
          (err.code === 'CONFLICT' || err.code === 'OBJECT_NOT_FOUND')
        ) {
          // Ignore this error, it means no pool was found for this fee tier, or there's not enough liquidity
          return undefined;
        }

        throw err;
      }
    });

    const results = await Promise.all(quotePromises);
    const quotes = results.filter((quote): quote is GetQuoteResult => quote !== undefined);

    if (quotes.length === 0) {
      throw GSwapSDKError.noPoolAvailableError(tokenIn, tokenOut);
    }

    // Return the quote with the highest output amount
    return quotes.reduce((best, current) =>
      current.outTokenAmount.isGreaterThan(best.outTokenAmount) ? current : best,
    );
  }

  /**
   * Gets a quote for an exact amount of tokens being bought.
   * @param tokenIn - The input token sell.
   * @param tokenOut - The output token to buy.
   * @param amountOut - The exact amount of output tokens you want to buy.
   * @param fee - The pool fee tier. If not specified, will check all available fee tiers and return the best quote.
   * @returns The expected number of tokens you will need to sell (input) to receive the specified amount of output tokens.
   */
  async quoteExactOutput(
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    amountOut: string | number | BigNumber,
    fee?: FEE_TIER,
  ): Promise<GetQuoteResult> {
    validateNumericAmount(amountOut, 'amountOut');

    if (fee !== undefined) {
      // Get quote from specific fee tier
      const result = await this.getSingleQuoteExactOutput(tokenIn, tokenOut, amountOut, fee);
      return result;
    }

    // Get quotes from all fee tiers and return the best one
    const allFees = [FEE_TIER.PERCENT_00_05, FEE_TIER.PERCENT_00_30, FEE_TIER.PERCENT_01_00];

    const quotePromises = allFees.map(async (feeTier) => {
      try {
        return await this.getSingleQuoteExactOutput(tokenIn, tokenOut, amountOut, feeTier);
      } catch (err) {
        if (
          err instanceof GSwapSDKError &&
          (err.code === 'CONFLICT' || err.code === 'OBJECT_NOT_FOUND')
        ) {
          // Ignore this error, it means no pool was found for this fee tier, or there's not enough liquidity
          return undefined;
        }

        throw err;
      }
    });

    const results = await Promise.all(quotePromises);
    const quotes = results.filter((quote): quote is GetQuoteResult => quote !== undefined);

    if (quotes.length === 0) {
      throw GSwapSDKError.noPoolAvailableError(tokenIn, tokenOut);
    }

    // Return the quote with the lowest input amount (least tokens needed to sell)
    return quotes.reduce((best, current) =>
      current.inTokenAmount.isLessThan(best.inTokenAmount) ? current : best,
    );
  }

  private async getSingleQuote(
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    fee: FEE_TIER,
    amount: NumericAmount,
    isExactInput: boolean,
  ): Promise<GetQuoteResult> {
    const tokenInClass = parseTokenClassKey(tokenIn);
    const tokenOutClass = parseTokenClassKey(tokenOut);
    const ordering = getTokenOrdering(tokenInClass, tokenOutClass, false);

    // Format amount based on quote type
    const formattedAmount = isExactInput
      ? BigNumber(amount).toFixed()
      : BigNumber(amount).multipliedBy(-1).toFixed();

    const response = await this.sendQuoteRequest('/QuoteExactAmount', {
      ...ordering,
      fee: fee,
      amount: formattedAmount,
    });

    const tokenInAmount = ordering.zeroForOne ? response.amount0 : response.amount1;
    const tokenOutAmount = ordering.zeroForOne ? response.amount1 : response.amount0;

    let currentPrice = response.currentSqrtPrice.pow(2) as Price;
    let newPrice = response.newSqrtPrice.pow(2) as Price;

    if (!ordering.zeroForOne) {
      currentPrice = BigNumber(1).dividedBy(currentPrice) as Price;
      newPrice = BigNumber(1).dividedBy(newPrice) as Price;
    }

    const priceImpact = newPrice.minus(currentPrice).dividedBy(currentPrice);

    return {
      amount0: response.amount0,
      amount1: response.amount1,
      currentPoolSqrtPrice: response.currentSqrtPrice,
      newPoolSqrtPrice: response.newSqrtPrice,
      currentPrice,
      newPrice,
      inTokenAmount: tokenInAmount.abs(),
      outTokenAmount: tokenOutAmount.abs(),
      priceImpact,
      feeTier: fee,
    };
  }

  private async getSingleQuoteExactInput(
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    fee: FEE_TIER,
    amountIn: NumericAmount,
  ): Promise<GetQuoteResult> {
    return this.getSingleQuote(tokenIn, tokenOut, fee, amountIn, true);
  }

  private async getSingleQuoteExactOutput(
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    amountOut: string | number | BigNumber,
    fee: FEE_TIER,
  ): Promise<GetQuoteResult> {
    return this.getSingleQuote(tokenIn, tokenOut, fee, amountOut, false);
  }

  private async sendQuoteRequest(
    endpoint: string,
    body: unknown,
  ): Promise<QuoteExactAmountResponse> {
    const response = await this.httpClient.sendPostRequest(
      this.gatewayBaseUrl,
      this.dexContractBasePath,
      endpoint,
      body,
    );

    const responseBody = response as {
      Status: number;
      Data: QuoteExactAmountRawResponse;
      error?: {
        Status: number;
        Message: string;
        ErrorCode: number;
        ErrorKey: string;
      };
    };

    // Convert string fields to BigNumber
    return {
      amount0: BigNumber(responseBody.Data.amount0),
      amount1: BigNumber(responseBody.Data.amount1),
      currentSqrtPrice: BigNumber(responseBody.Data.currentSqrtPrice) as SqrtPrice,
      newSqrtPrice: BigNumber(responseBody.Data.newSqrtPrice) as SqrtPrice,
    };
  }
}
