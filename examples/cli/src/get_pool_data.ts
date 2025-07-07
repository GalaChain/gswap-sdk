import { GSwap } from '@gala-chain/gswap-sdk';

export async function getPoolData(inToken: string, outToken: string, fee: number) {
  const gSwap = new GSwap({});

  const poolData = await gSwap.pools.getPoolData(inToken, outToken, fee);
  const spotPrice = gSwap.pools.calculateSpotPrice(inToken, outToken, poolData.sqrtPrice);

  return {
    ...poolData,
    spotPrice: spotPrice.toString(),
  };
}
