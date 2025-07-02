import { GetUserPositionsResult, GSwap } from '@galachain/gswap-sdk';

export async function getUserPositions(address: string) {
  const gSwap = new GSwap({
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com', // TODO
  });

  let bookmark = '';
  const allPositions: GetUserPositionsResult[] = [];

  do {
    const positionsResult = await gSwap.positions.getUserPositions(address);
    bookmark = positionsResult.bookmark;
    allPositions.push(...positionsResult.positions);
  } while (bookmark);

  return allPositions;
}
