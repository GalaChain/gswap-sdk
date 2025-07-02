import { GSwap, PrivateKeySigner } from '@galachain/gswap-sdk';
import 'dotenv/config';

export async function removeAllLiquidity(walletAddress: string, positionId: string) {
  const privateKey = process.env.GALACHAIN_PRIVATE_KEY;
  if (!privateKey) {
    console.log(
      'You must set the GALACHAIN_PRIVATE_KEY environment variable with your private key.',
    );
    process.exit(2);
  }

  const gSwap = new GSwap({
    signer: new PrivateKeySigner(privateKey!),
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com',
  });

  await GSwap.events.connectEventSocket();

  try {
    const position = await gSwap.positions.getPositionById(walletAddress, positionId);
    if (!position) {
      throw new Error(`Position with ID ${positionId} not found.`);
    }

    console.log('📤 Submitting remove liquidity transaction...');
    const pendingTx = await gSwap.positions.removeLiquidity({
      walletAddress,
      positionId,
      token0: position.token0ClassKey,
      token1: position.token1ClassKey,
      fee: position.fee,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
      amount: position.liquidity,
      amount0Min: '0',
      amount1Min: '0',
    });

    console.log(`⏳ Waiting for transaction ${pendingTx.transactionId} to complete...`);
    const result = await pendingTx.wait();
    console.log('✅ Remove liquidity transaction completed!');

    return result;
  } finally {
    GSwap.events.disconnectEventSocket();
  }
}
