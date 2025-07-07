import {
  GalaChainTokenClassKey,
  GSwap,
  NumericAmount,
  PriceIn,
  PrivateKeySigner,
} from '@gala-chain/gswap-sdk';
import BigNumber from 'bignumber.js';
import 'dotenv/config';

export async function createNewPosition(
  walletAddress: string,
  token0: GalaChainTokenClassKey | string,
  token1: GalaChainTokenClassKey | string,
  amount0Desired: NumericAmount,
  amount1Desired: NumericAmount,
  fee: number,
  minPrice = 0 as PriceIn,
  maxPrice = Infinity as PriceIn,
) {
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
    const pool = await gSwap.pools.getPoolData(token0, token1, fee);

    console.log('📤 Submitting create position transaction...');
    const pendingTx = await gSwap.positions.addLiquidityByPrice({
      walletAddress,
      positionId: '',
      token0,
      token1,
      fee,
      tickSpacing: pool.tickSpacing,
      minPrice,
      maxPrice,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      amount0Min: BigNumber(amount0Desired).multipliedBy(0.995),
      amount1Min: BigNumber(amount1Desired).multipliedBy(0.995),
    });

    console.log(`⏳ Waiting for transaction ${pendingTx.transactionId} to complete...`);
    const result = await pendingTx.wait();
    console.log('✅ Create position transaction completed!');

    return result;
  } finally {
    GSwap.events.disconnectEventSocket();
  }
}
