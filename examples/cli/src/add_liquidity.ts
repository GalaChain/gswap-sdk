import { GSwap, PriceIn, PrivateKeySigner, stringifyTokenClassKey } from '@gala-chain/gswap-sdk';
import BigNumber from 'bignumber.js';
import 'dotenv/config';
import { getPositionById } from './get_position_by_id.js';

export async function addLiquidityToExistingPosition(
  address: string,
  positionId: string,
  token0Amount: number,
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
    const position = await getPositionById(address, positionId);
    if (!position) {
      throw new Error(`Position with ID ${positionId} not found.`);
    }

    const poolData = await gSwap.pools.getPoolData(
      position.token0ClassKey,
      position.token1ClassKey,
      position.fee,
    );

    const currentPrice = gSwap.pools.calculateSpotPrice(
      position.token0ClassKey,
      position.token1ClassKey,
      poolData.sqrtPrice,
    );

    const optimalToken1Amount = gSwap.positions.calculateOptimalPositionSize(
      token0Amount,
      currentPrice,
      gSwap.pools.calculatePriceForTicks(position.tickLower),
      gSwap.pools.calculatePriceForTicks(position.tickUpper),
      6, // Assuming 6 decimal places for token0 (if it's wrong the difference is pretty negligible)
      6, // Assuming 6 decimal places for token1
    );

    console.log(
      `💰 Calculated ${optimalToken1Amount} to add for token1 (${stringifyTokenClassKey(position.token1ClassKey)})`,
    );

    console.log('📤 Submitting add liquidity transaction...');
    const pendingTx = await gSwap.positions.addLiquidityByTicks({
      walletAddress: address,
      positionId: position.positionId,
      token0: position.token0ClassKey,
      token1: position.token1ClassKey,
      fee: position.fee,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
      amount0Desired: token0Amount,
      amount1Desired: optimalToken1Amount,
      amount0Min: BigNumber(token0Amount).multipliedBy(0.995),
      amount1Min: optimalToken1Amount.multipliedBy(0.995),
    });

    console.log(`⏳ Waiting for transaction ${pendingTx.transactionId} to complete...`);
    const result = await pendingTx.wait();
    console.log('✅ Add liquidity transaction completed!');

    return result;
  } finally {
    GSwap.events.disconnectEventSocket();
  }
}

export async function addLiquidityByPrice(
  walletAddress: string,
  positionId: string,
  token0: string,
  token1: string,
  fee: number,
  tickSpacing: number,
  minPrice: string,
  maxPrice: string,
  amount0Desired: string,
  amount1Desired: string,
  amount0Min: string,
  amount1Min: string,
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
    console.log('📤 Submitting add liquidity by price transaction...');
    const pendingTx = await gSwap.positions.addLiquidityByPrice({
      walletAddress,
      positionId,
      token0,
      token1,
      fee,
      tickSpacing,
      minPrice: minPrice as PriceIn,
      maxPrice: maxPrice as PriceIn,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
    });

    console.log(`⏳ Waiting for transaction ${pendingTx.transactionId} to complete...`);
    const result = await pendingTx.wait();
    console.log('✅ Add liquidity by price transaction completed!');

    return result;
  } finally {
    GSwap.events.disconnectEventSocket();
  }
}

export async function addLiquidityByTicks(
  walletAddress: string,
  positionId: string,
  token0: string,
  token1: string,
  fee: number,
  tickLower: number,
  tickUpper: number,
  amount0Desired: string,
  amount1Desired: string,
  amount0Min: string,
  amount1Min: string,
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
    console.log('📤 Submitting add liquidity by ticks transaction...');
    const pendingTx = await gSwap.positions.addLiquidityByTicks({
      walletAddress,
      positionId,
      token0,
      token1,
      fee,
      tickLower,
      tickUpper,
      amount0Desired,
      amount1Desired,
      amount0Min,
      amount1Min,
    });

    console.log(`⏳ Waiting for transaction ${pendingTx.transactionId} to complete...`);
    const result = await pendingTx.wait();
    console.log('✅ Add liquidity by ticks transaction completed!');

    return result;
  } finally {
    GSwap.events.disconnectEventSocket();
  }
}
