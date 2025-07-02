import { GSwap } from '@gala-chain/gswap-sdk';

export async function getPoolData(inToken: string, outToken: string, fee: number) {
  const gSwap = new GSwap({
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com', // TODO
  });

  const poolData = await gSwap.pools.getPoolData(inToken, outToken, fee);
  const spotPrice = gSwap.pools.calculateSpotPrice(inToken, outToken, poolData.sqrtPrice);

  return {
    ...poolData,
    spotPrice: spotPrice.toString(),
  };
}
