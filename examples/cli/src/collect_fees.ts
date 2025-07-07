import { GSwap, PrivateKeySigner } from '@gala-chain/gswap-sdk';
import 'dotenv/config';
import { getPositionById } from './get_position_by_id.js';

export async function collectFeesFromPosition(address: string, positionId: string) {
  const privateKey = process.env.GALACHAIN_PRIVATE_KEY;
  if (!privateKey) {
    console.log(
      'You must set the GALACHAIN_PRIVATE_KEY environment variable with your private key.',
    );
    process.exit(2);
  }

  const gSwap = new GSwap({
    signer: new PrivateKeySigner(privateKey!),
  });

  await GSwap.events.connectEventSocket();

  try {
    const position = await getPositionById(address, positionId);
    if (!position) {
      throw new Error(`Position with ID ${positionId} not found.`);
    }

    console.log('📤 Submitting collect fees transaction...');
    const pendingTx = await gSwap.positions.collectPositionFees({
      walletAddress: address,
      positionId: position.positionId,
      token0: position.token0ClassKey,
      token1: position.token1ClassKey,
      fee: position.fee,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
      amount0Requested: position.tokensOwed0,
      amount1Requested: position.tokensOwed1,
    });

    console.log(`⏳ Waiting for transaction ${pendingTx.transactionId} to complete...`);
    const result = await pendingTx.wait();
    console.log('✅ Collect fees transaction completed!');

    return result;
  } finally {
    GSwap.events.disconnectEventSocket();
  }
}
