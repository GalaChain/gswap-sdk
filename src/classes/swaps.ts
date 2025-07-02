import BigNumber from 'bignumber.js';
import { NumericAmount } from '../types/amounts.js';
import { GalaChainTokenClassKey } from '../types/token.js';
import { parseTokenClassKey, stringifyTokenClassKey } from '../utils/token.js';
import { getTokenOrdering } from '../utils/token_ordering.js';
import { validateFee, validateNumericAmount, validateWalletAddress } from '../utils/validation.js';
import { Bundler } from './bundler.js';

const MIN_SQRT_PRICE_LIMIT = '0.000000000000000000094212147';
const MAX_SQRT_PRICE_LIMIT = '18446050999999999999';

/**
 * Service for handling token swap operations.
 */
export class Swaps {
  constructor(private readonly bundlerService: Bundler) {}

  /**
   * Executes a token swap transaction.
   * @param walletAddress - The wallet address executing the swap.
   * @param tokenIn - The input token to sell.
   * @param tokenOut - The output token to buy.
   * @param fee - The pool fee tier.
   * @param amount - Swap parameters specifying either exact input or exact output.
   * @param amount.exactIn - For exact input swaps, the exact amount of input tokens to sell.
   * @param amount.amountOutMinimum - For exact input swaps, the minimum amount of output tokens to buy (slippage protection).
   * @param amount.exactOut - For exact output swaps, the exact amount of output tokens to buy.
   * @param amount.amountInMaximum - For exact output swaps, the maximum amount of input tokens to sell (slippage protection).
   * @returns Pending transaction.
   * @example
   * ```typescript
   * // Exact input swap: sell 100 GALA for USDC
   * const result = await swapsService.swap(
   *   'eth|123...abc',
   *   'GALA|Unit|none|none',
   *   'GUSDC|Unit|none|none',
   *   500,
   *   { exactIn: '100', amountOutMinimum: '45' }
   * );
   * console.log('Swap successful:', result);
   * ```
   */
  async swap(
    walletAddress: string,
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    fee: number,
    amount:
      | {
          exactIn: NumericAmount;
          amountOutMinimum?: NumericAmount;
        }
      | {
          exactOut: NumericAmount;
          amountInMaximum?: NumericAmount;
        },
  ) {
    validateWalletAddress(walletAddress);
    validateFee(fee);

    if ('exactIn' in amount) {
      validateNumericAmount(amount.exactIn, 'exactIn');
      if (amount.amountOutMinimum !== undefined) {
        validateNumericAmount(amount.amountOutMinimum, 'amountOutMinimum', true);
      }
    } else {
      validateNumericAmount(amount.exactOut, 'exactOut');
      if (amount.amountInMaximum !== undefined) {
        validateNumericAmount(amount.amountInMaximum, 'amountInMaximum');
      }
    }

    const ordering = getTokenOrdering(tokenIn, tokenOut, false);
    const zeroForOne = stringifyTokenClassKey(tokenIn) === stringifyTokenClassKey(ordering.token0);

    const rawAmount =
      'exactIn' in amount
        ? amount.exactIn.toString()
        : BigNumber(amount.exactOut).multipliedBy(-1).toString();
    const rawAmountOutMinimum =
      'exactIn' in amount
        ? amount.amountOutMinimum?.toString()
          ? BigNumber(amount.amountOutMinimum).multipliedBy(-1).toString()
          : undefined
        : BigNumber(amount.exactOut ?? 0)
            .multipliedBy(-1)
            .toString();
    const rawAmountInMaximum =
      'exactIn' in amount
        ? amount.exactIn.toString()
        : amount.amountInMaximum
          ? amount.amountInMaximum.toString()
          : undefined;

    const toSign = {
      token0: parseTokenClassKey(ordering.token0),
      token1: parseTokenClassKey(ordering.token1),
      fee: fee,
      amount: rawAmount,
      zeroForOne,
      sqrtPriceLimit: ordering.zeroForOne ? MIN_SQRT_PRICE_LIMIT : MAX_SQRT_PRICE_LIMIT,
      recipient: walletAddress,
      amountOutMinimum: rawAmountOutMinimum,
      amountInMaximum: rawAmountInMaximum,
    };

    const token0StringKey = stringifyTokenClassKey(ordering.token0, '$');
    const token1StringKey = stringifyTokenClassKey(ordering.token1, '$');

    const poolString = `$pool$${token0StringKey}$${token1StringKey}$${fee}`;
    const tokenBalance0 = `$tokenBalance$${token0StringKey}$${walletAddress}`;
    const tokenBalance1 = `$tokenBalance$${token1StringKey}$${walletAddress}`;
    const tokenBalance0Pool = `$tokenBalance$${token0StringKey}$${poolString}`;
    const tokenBalance1Pool = `$tokenBalance$${token1StringKey}$${poolString}`;

    const stringsInstructions = [
      poolString,
      tokenBalance0,
      tokenBalance1,
      tokenBalance0Pool,
      tokenBalance1Pool,
    ];

    return this.bundlerService.sendBundlerRequest('Swap', toSign, stringsInstructions);
  }
}
