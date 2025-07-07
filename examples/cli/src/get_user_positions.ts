import { GetUserPositionsResult, GSwap } from '@gala-chain/gswap-sdk';

export async function getUserPositions(address: string) {
  const gSwap = new GSwap({});

  let bookmark = '';
  const allPositions: GetUserPositionsResult[] = [];

  do {
    const positionsResult = await gSwap.positions.getUserPositions(address);
    bookmark = positionsResult.bookmark;
    allPositions.push(...positionsResult.positions);
  } while (bookmark);

  return allPositions;
}
