import { GSwap, PriceIn, PrivateKeySigner } from '@galachain/gswap-sdk';
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
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com', // TODO
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
      10_000,
    );

    // We'll use the current price to determine how much of token1 to add
    const currentPrice = gSwap.pools.calculateSpotPrice(
      position.token0ClassKey,
      position.token1ClassKey,
      poolData.sqrtPrice,
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
      amount1Desired: currentPrice.multipliedBy(token0Amount),
      amount0Min: BigNumber(token0Amount).multipliedBy(0.995),
      amount1Min: currentPrice.multipliedBy(token0Amount).multipliedBy(0.995),
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
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com', // TODO
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
    gatewayBaseUrl:
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com', // TODO
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
