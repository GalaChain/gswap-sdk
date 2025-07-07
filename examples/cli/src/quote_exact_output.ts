import {
  FEE_TIER,
  GSwap,
  type GalaChainTokenClassKey,
  type NumericAmount,
} from '@gala-chain/gswap-sdk';

export async function quoteExactOutput(
  tokenIn: GalaChainTokenClassKey | string, // The token you are selling
  tokenOut: GalaChainTokenClassKey | string, // The token you are buying
  outAmount: NumericAmount, // The amount of tokenOut you want to receive
  fee?: FEE_TIER, // The fee tier of the pool. If not specified, will use the best available pool.
) {
  const gSwap = new GSwap({});

  const quote = await gSwap.quoting.quoteExactOutput(tokenIn, tokenOut, outAmount, fee);
  return quote;
}
