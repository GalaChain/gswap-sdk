import { createValidDTO, TokenBalance, TokenClassKey } from '@gala-chain/api';
import { GalaChainContext } from '@gala-chain/chaincode';
import {
  CompositePoolDto,
  DexFeePercentageTypes,
  GetCompositePoolDto,
  Pool,
  quoteExactAmount,
  QuoteExactAmountDto,
  TickData,
} from '@gala-chain/dex';
import BigNumber from 'bignumber.js';
import { NumericAmount, Price, SqrtPrice } from '../types/amounts.js';
import { FEE_TIER } from '../types/fees.js';
import type { GetQuoteResult } from '../types/sdk_results.js';
import type { GalaChainTokenClassKey } from '../types/token.js';
import { compareTokens, getTokenOrdering, parseTokenClassKey } from '../utils/token.js';
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
    const tokenInClassKey = await createValidDTO<TokenClassKey>(TokenClassKey, tokenInClass);
    const tokenOutClass = parseTokenClassKey(tokenOut);
    const tokenOutClassKey = await createValidDTO<TokenClassKey>(TokenClassKey, tokenOutClass);
    const ordering = getTokenOrdering(tokenInClass, tokenOutClass, false);

    // Create DTOs for ordered tokens (token0 < token1 as required by DEX library)
    // ordering.token0 and token1 are already parsed GalaChainTokenClassKey objects
    const token0ClassKey = await createValidDTO<TokenClassKey>(
      TokenClassKey,
      ordering.token0 as GalaChainTokenClassKey,
    );
    const token1ClassKey = await createValidDTO<TokenClassKey>(
      TokenClassKey,
      ordering.token1 as GalaChainTokenClassKey,
    );

    // Format amount based on quote type
    const formattedAmount = isExactInput
      ? BigNumber(amount).toFixed()
      : BigNumber(amount).multipliedBy(-1).toFixed();

    // TODO: use native dex types from the dex library throughout the sdk
    let feeType: DexFeePercentageTypes;
    switch (fee) {
      case FEE_TIER.PERCENT_00_05:
        feeType = DexFeePercentageTypes.FEE_0_05_PERCENT;
        break;
      case FEE_TIER.PERCENT_00_30:
        feeType = DexFeePercentageTypes.FEE_0_3_PERCENT;
        break;
      case FEE_TIER.PERCENT_01_00:
        feeType = DexFeePercentageTypes.FEE_1_PERCENT;
        break;
      default:
        throw new Error(`Invalid fee tier: ${fee}`);
    }

    const zeroForOne = compareTokens(tokenIn, tokenOut) < 0;

    const getCompositePoolDto = new GetCompositePoolDto(
      zeroForOne ? tokenInClassKey : tokenOutClassKey,
      zeroForOne ? tokenOutClassKey : tokenInClassKey,
      feeType,
    );

    //get composite pool data
    const compositePoolResponse = await this.sendGetCompositePoolRequest(getCompositePoolDto);

    // Convert response data to proper CompositePoolDto with BigNumber conversions
    const compositePool = this.createCompositePoolDtoFromResponse(compositePoolResponse);

    // Use ordered tokens (token0 < token1) as required by DEX library
    const quoteDto = new QuoteExactAmountDto(
      token0ClassKey,
      token1ClassKey,
      feeType,
      BigNumber(formattedAmount),
      zeroForOne,
      compositePool,
    );

    // fake context - not used when providing a composite pool
    const context = {
      callingUser: 'eth|123...abc',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub: null as any,
      clientIdentity: {
        getMSPID: () => 'UsersOrg',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    } as GalaChainContext;
    const response = await quoteExactAmount(context, quoteDto);

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
      currentPoolSqrtPrice: response.currentSqrtPrice as SqrtPrice,
      newPoolSqrtPrice: response.newSqrtPrice as SqrtPrice,
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

  private async sendGetCompositePoolRequest(
    getCompositePoolDto: GetCompositePoolDto,
  ): Promise<CompositePoolDto> {
    const response = await this.httpClient.sendPostRequest(
      this.gatewayBaseUrl,
      this.dexContractBasePath,
      '/GetCompositePool',
      getCompositePoolDto,
    );

    const responseBody = response as {
      Status: number;
      Data: CompositePoolDto;
      error?: {
        Status: number;
        Message: string;
        ErrorCode: number;
        ErrorKey: string;
      };
    };

    return responseBody.Data;
  }

  /**
   * Converts response data from GetCompositePool API into a proper CompositePoolDto
   * Based on the working implementation in quote-local.mjs
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createCompositePoolDtoFromResponse(responseData: any): CompositePoolDto {
    // 1. Create Pool object with proper BigNumber conversions
    const pool = new Pool(
      responseData.pool.token0,
      responseData.pool.token1,
      responseData.pool.token0ClassKey,
      responseData.pool.token1ClassKey,
      responseData.pool.fee,
      new BigNumber(responseData.pool.sqrtPrice),
      responseData.pool.protocolFees,
    );

    // Set additional pool properties with BigNumber conversions
    pool.bitmap = responseData.pool.bitmap;
    pool.grossPoolLiquidity = new BigNumber(responseData.pool.grossPoolLiquidity);
    pool.liquidity = new BigNumber(responseData.pool.liquidity);
    pool.feeGrowthGlobal0 = new BigNumber(responseData.pool.feeGrowthGlobal0);
    pool.feeGrowthGlobal1 = new BigNumber(responseData.pool.feeGrowthGlobal1);
    pool.protocolFeesToken0 = new BigNumber(responseData.pool.protocolFeesToken0);
    pool.protocolFeesToken1 = new BigNumber(responseData.pool.protocolFeesToken1);
    pool.tickSpacing = responseData.pool.tickSpacing;
    pool.maxLiquidityPerTick = new BigNumber(responseData.pool.maxLiquidityPerTick);

    // 2. Create tick data map with proper TickData objects
    const tickDataMap: { [key: string]: TickData } = {};
    Object.keys(responseData.tickDataMap).forEach((tickKey) => {
      const tickData = responseData.tickDataMap[tickKey];
      tickDataMap[tickKey] = new TickData(tickData.poolHash, tickData.tick);
      // Set properties directly
      tickDataMap[tickKey].initialised = tickData.initialised;
      tickDataMap[tickKey].liquidityNet = new BigNumber(tickData.liquidityNet);
      tickDataMap[tickKey].liquidityGross = new BigNumber(tickData.liquidityGross);
      tickDataMap[tickKey].feeGrowthOutside0 = new BigNumber(tickData.feeGrowthOutside0);
      tickDataMap[tickKey].feeGrowthOutside1 = new BigNumber(tickData.feeGrowthOutside1);
    });

    // 3. Create TokenBalance objects - simplified to avoid type conflicts
    const token0Balance = new TokenBalance({
      owner: responseData.token0Balance.owner,
      collection: responseData.token0Balance.collection,
      category: responseData.token0Balance.category,
      type: responseData.token0Balance.type,
      additionalKey: responseData.token0Balance.additionalKey,
    });
    // Set quantity using type assertion to avoid private property access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (token0Balance as any).quantity = new BigNumber(responseData.token0Balance.quantity);

    const token1Balance = new TokenBalance({
      owner: responseData.token1Balance.owner,
      collection: responseData.token1Balance.collection,
      category: responseData.token1Balance.category,
      type: responseData.token1Balance.type,
      additionalKey: responseData.token1Balance.additionalKey,
    });
    // Set quantity using type assertion to avoid private property access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (token1Balance as any).quantity = new BigNumber(responseData.token1Balance.quantity);

    // 4. Create and return CompositePoolDto - use type assertion to avoid type conflicts
    return new CompositePoolDto(
      pool,
      tickDataMap,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      token0Balance as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      token1Balance as any,
      responseData.token0Decimals,
      responseData.token1Decimals,
    );
  }
}
