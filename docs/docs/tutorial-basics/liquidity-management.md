---
sidebar_position: 5
---

# Liquidity Management

This guide explains how to manage liquidity positions on gSwap, including creating new positions, adding liquidity to existing positions, removing liquidity, and collecting fees.

## Prerequisites

- Make sure you've completed the [Getting Started](../getting-started.md) guide and have your SDK properly configured.
- You should also read the [Transaction Status Monitoring](./transaction-status.md) guide to understand realtime transaction status monitoring.

The examples in this article assume you have a gSwap instance set up with a signer and have connected to the event socket for transaction monitoring:

```typescript
import { GSwap, FEE_TIER } from '@gala-chain/gswap-sdk';
import BigNumber from 'bignumber.js';

// Connect globally for transaction monitoring
await GSwap.events.connectEventSocket();

// Create instance with signer
const gSwap = new GSwap({ signer: yourSigner });
```

## Understanding Liquidity Positions

Liquidity positions in gSwap are based on Uniswap V3's concentrated liquidity model:

- **Price Range**: Each position has a specific price range (tick range) where your liquidity is active
- **Fee Tiers**: Different pools have different fee structures (0.05%, 0.3%, 1.0%)
- **Fee Collection**: You earn fees when trades occur within your position's price range

## Token Ordering

Before creating liquidity positions, it's important to understand how tokens are ordered in pools. Every pool has two tokens, and one of those two tokens is referred to as `token0` while the other is `token1`. Which is which? Fortunately the answer is simple: the one that sorts lexographically first is `token0`, and the other is `token1`.

The gSwap SDK exports a `compareTokens` function which returns a negative number if the first token comes before the second, zero if they are equal, and a positive number if the first token comes after the second.

Many liquidity management operations in the SDK have `token0` and `token1` parameters, and potentially other similarly named parameters (e.g. `amount0` and `amount1`). It is necessary to pass the values in the correct order as described above, or the SDK will throw an error.

For example, when creating a GALA/USDC position:

- `GALA|Unit|none|none` sorts before `GUSDC|Unit|none|none` lexographically
- Therefore: `token0` = `'GALA|Unit|none|none'` and `token1` = `'GUSDC|Unit|none|none'`
- Your `amount0Desired` refers to $GALA, and `amount1Desired` refers to USDC

## Creating New Liquidity Positions

### Method 1: Using Price Range

Use `gSwap.positions.addLiquidityByPrice()` to create a position with a specific price range:

```typescript
import { GSwap, FEE_TIER, PriceIn } from '@gala-chain/gswap-sdk';
import BigNumber from 'bignumber.js';

const minPrice: PriceIn = '0.5' as PriceIn; // Position active from 0.5 USDC per $GALA
const maxPrice: PriceIn = '0.8' as PriceIn; // Position active up to 0.8 USDC per $GALA
const desiredGalaAmount = '1000'; // Amount of GALA we want to provide

// Get current pool data to calculate optimal token amounts
const poolData = await gSwap.pools.getPoolData(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  FEE_TIER.PERCENT_00_30,
);

// Get current spot price
const currentPrice = gSwap.pools.calculateSpotPrice(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  poolData.sqrtPrice,
);

// Calculate optimal amount of USDC liquidity to add based on desired GALA amount (1000)
// This ensures your liquidity is deployed efficiently across the price range
const optimalUsdcAmount = gSwap.positions.calculateOptimalPositionSize(
  desiredGalaAmount, // Amount of GALA we want to provide
  currentPrice, // Current pool price
  minPrice, // Lower bound of our position
  maxPrice, // Upper bound of our position
  8, // GALA decimals
  6, // USDC decimals
);

// Create a new GALA/USDC position with a price range
const pendingTx = await gSwap.positions.addLiquidityByPrice({
  walletAddress: 'eth|123...abc',
  positionId: '', // Empty string for new positions
  token0: 'GALA|Unit|none|none',
  token1: 'GUSDC|Unit|none|none',
  fee: FEE_TIER.PERCENT_00_30, // 0.3% fee tier
  tickSpacing: 60,
  minPrice,
  maxPrice,
  amount0Desired: desiredGalaAmount, // The amount of GALA we want to provide
  amount1Desired: optimalUsdcAmount, // Calculated optimal USDC amount
  amount0Min: BigNumber(desiredGalaAmount).multipliedBy(0.95), // 5% slippage
  amount1Min: optimalUsdcAmount.multipliedBy(0.95), // 5% slippage
});

console.log('New position transaction submitted:', pendingTx.transactionId);

// Wait for transaction to complete
const result = await pendingTx.wait();
console.log('✅ Position created successfully!', result);
```

:::info Full Range Liquidity
You can create a position that is active across the entire price range by setting `minPrice` to `0` and `maxPrice` to `Infinity`. This is useful for providing liquidity without specific price constraints.
:::

:::info Min and Desired Amounts
Although typical EVM-style MEV attacks are not a concern on gSwap, it's still good practice to set `amount0Min` and `amount1Min` to protect against unexpected price movements.
:::

### Method 2: Using Tick Range

Use `gSwap.positions.addLiquidityByTicks()` if you prefer to directly control the tick range, or if you're adding liquidity to an existing position and know its exact tick range:

```typescript
// Create position with specific tick range
// Note: For optimal token ratios with tick-based positions, you would need to
// calculate your token amounts as shown in the above example. This example uses
// hardcoded token amounts for simplicity.
const pendingTx = await gSwap.positions.addLiquidityByTicks({
  walletAddress: 'eth|123...abc',
  positionId: '', // Empty string for new positions
  token0: 'GALA|Unit|none|none',
  token1: 'GUSDC|Unit|none|none',
  fee: FEE_TIER.PERCENT_00_30, // 0.3% fee tier
  tickLower: -6000, // Lower price boundary
  tickUpper: 6000, // Upper price boundary
  amount0Desired: '1000',
  amount1Desired: '500',
  amount0Min: '950',
  amount1Min: '475',
});

console.log('Position transaction submitted:', pendingTx.transactionId);
const result = await pendingTx.wait();
console.log('✅ Position created successfully!', result);
```

## Adding Liquidity to Existing Positions

```typescript
import BigNumber from 'bignumber.js';

// Get current position details
const position = await gSwap.positions.getPositionById('eth|123...abc', 'position-uuid-123');

// Get current pool price
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

// Convert position ticks to prices to calculate optimal token amounts
const lowerPrice = gSwap.pools.calculatePriceForTicks(position.tickLower);
const upperPrice = gSwap.pools.calculatePriceForTicks(position.tickUpper);

// Calculate optimal token1 amount based on desired token0 amount and position's price range
const desiredToken0Amount = '100';
const optimalToken1Amount = gSwap.positions.calculateOptimalPositionSize(
  desiredToken0Amount,
  currentPrice,
  lowerPrice,
  upperPrice,
  8, // token0 decimals
  6, // token1 decimals
);

// Add liquidity to existing position
const pendingTx = await gSwap.positions.addLiquidityByTicks({
  walletAddress: 'eth|123...abc',
  positionId: position.positionId,
  token0: position.token0ClassKey,
  token1: position.token1ClassKey,
  fee: position.fee,
  tickLower: position.tickLower,
  tickUpper: position.tickUpper,
  amount0Desired: desiredToken0Amount,
  amount1Desired: optimalToken1Amount,
  amount0Min: BigNumber(desiredToken0Amount).multipliedBy(0.995), // 0.5% slippage
  amount1Min: optimalToken1Amount.multipliedBy(0.995),
});

console.log('Add liquidity transaction submitted:', pendingTx.transactionId);
const result = await pendingTx.wait();
console.log('✅ Liquidity added successfully!', result);
```

## Removing Liquidity

```typescript
const position = await gSwap.positions.getPositionById('eth|123...abc', 'position-uuid-123');

// Assuming we want to remove half of our liquidity, divide current liquidity by 2
const halfLiquidity = position.liquidity.dividedBy(2);

const pendingTx = await gSwap.positions.removeLiquidity({
  walletAddress: 'eth|123...abc',
  positionId: position.positionId,
  token0: position.token0ClassKey,
  token1: position.token1ClassKey,
  fee: position.fee,
  tickLower: position.tickLower,
  tickUpper: position.tickUpper,
  amount: halfLiquidity, // Remove 50% of liquidity
  amount0Min: '0', // Minimum tokens to receive (increase if slippage protection is desired)
  amount1Min: '0', // Minimum tokens to receive (increase if slippage protection is desired)
});

console.log('Remove liquidity transaction submitted:', pendingTx.transactionId);
const result = await pendingTx.wait();
console.log('✅ Liquidity removed successfully!', result);
```

## Collecting Fees

### Check Available Fees

```typescript
// Get position details to see accumulated fees
const position = await gSwap.positions.getPositionById('eth|123...abc', 'position-uuid-123');

console.log('Available fees:');
console.log('Token0 fees:', position.tokensOwed0.toString());
console.log('Token1 fees:', position.tokensOwed1.toString());
```

### Collect All Available Fees

```typescript
// Collect all accumulated fees
const position = await gSwap.positions.getPositionById('eth|123...abc', 'position-uuid-123');

const pendingTx = await gSwap.positions.collectPositionFees({
  walletAddress: 'eth|123...abc',
  positionId: position.positionId,
  token0: position.token0ClassKey,
  token1: position.token1ClassKey,
  fee: position.fee,
  tickLower: position.tickLower,
  tickUpper: position.tickUpper,
  amount0Requested: position.tokensOwed0, // All available token0 fees
  amount1Requested: position.tokensOwed1, // All available token1 fees
});

console.log('Collect fees transaction submitted:', pendingTx.transactionId);
const result = await pendingTx.wait();
console.log('✅ Fees collected successfully!', result);
```

## Tips

- **Price Impact**: Large liquidity additions/removals can affect pool prices significantly, especially in low-liquidity pools.
- **Slippage Protection**: Always set appropriate minimum amounts to protect against unexpected price movements.
- **Fee Collection**: Fees accumulate automatically but must be collected manually.
- **Position Lifecycle**: Positions can be modified (add/remove liquidity) but the price range is fixed.
- **Timing**: Position creation and modifications typically confirm within a few seconds, but may take longer in high-traffic pools.

## Next Steps

- Check out the [Pool Concepts](./../category/pool-concepts) section to understand more about how liquidity pools work.
- Explore [the API documentation](./../api/classes/GSwap) for lower-level API details.
