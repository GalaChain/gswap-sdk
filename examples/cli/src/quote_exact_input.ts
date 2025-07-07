import {
  FEE_TIER,
  GSwap,
  type GalaChainTokenClassKey,
  type NumericAmount,
} from '@gala-chain/gswap-sdk';

export async function quoteExactInput(
  tokenIn: GalaChainTokenClassKey | string, // The token you are selling
  tokenOut: GalaChainTokenClassKey | string, // The token you are buying
  inAmount: NumericAmount, // The amount of tokenIn you want to sell
  fee?: FEE_TIER, // The fee tier of the pool. If not specified, will use the best available pool.
) {
  const gSwap = new GSwap({});

  const quote = await gSwap.quoting.quoteExactInput(tokenIn, tokenOut, inAmount, fee);
  return quote;
}
