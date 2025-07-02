import { GSwap } from '@gala-chain/gswap-sdk';

export async function getPositionById(address: string, positionId: string) {
  const gSwap = new GSwap({
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com', // TODO
  });

  return gSwap.positions.getPositionById(address, positionId);
}
