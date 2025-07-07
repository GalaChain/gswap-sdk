import { GSwap } from '@gala-chain/gswap-sdk';

export async function getPositionById(address: string, positionId: string) {
  const gSwap = new GSwap({});

  return gSwap.positions.getPositionById(address, positionId);
}
