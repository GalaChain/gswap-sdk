---
sidebar_position: 1
---

# Slippage

Slippage occurs when the actual execution price of a trade differs from the expected price at the time you submit the transaction. This is a fundamental concept in automated market makers (AMMs) like gSwap.

## What Causes Slippage?

### Price Impact

When you trade against an AMM pool, your trade size affects the token ratio in the pool, which changes the price:

- **Large trades** relative to pool size cause more price impact
- **Small trades** in deep pools have minimal price impact

### Market Movement

Between the time you get a quote and your transaction executes, other traders may have submitted transactions that change the pool's state:

- Other swaps can move the price before your transaction processes
- Network congestion can delay your transaction
- Market volatility can cause rapid price changes

### Pool Depth

Pools with more liquidity (total value locked) provide better prices and less slippage:

- **Deep pools**: More resistance to price impact from individual trades
- **Shallow pools**: Higher sensitivity to trade size

## Types of Slippage

### Positive Slippage

When you receive a better price than expected:

```
Expected: Sell 100 $GALA for 50 USDC
Actual: Sell 100 $GALA for 52 USDC
Positive slippage: +2 USDC
```

This can happen when prices move in your favor between quote and execution.

### Negative Slippage

When you receive a worse price than expected:

```
Expected: Sell 100 $GALA for 50 USDC
Actual: Sell 100 $GALA for 48 USDC
Negative slippage: -2 USDC
```

This is a negative outcome and is why slippage protection is important.

## Slippage Protection

### Exact Input Swaps

When selling a specific amount, set `amountOutMinimum` to protect against excessive slippage:

```typescript
const pendingTx = await gSwap.swaps.swap(
  walletAddress,
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  FEE_TIER.PERCENT_01_00,
  {
    exactIn: '100', // Sell exactly 100 $GALA
    amountOutMinimum: '47.5', // We'll accept as little as 47.5 USDC (5% slippage tolerance from our expected 50 USDC)
  },
);
```

If the actual output would be less than 47.5 USDC, the transaction fails rather than executing at a bad price. The chaincode will guarantee that you will not receive less than the specified minimum.

:::info Gas Fees
Unlike most DEXs, there is no gas fee on gSwap for failed swaps, including those that fail due to slippage protection.
:::

### Exact Output Swaps

When buying a specific amount, set `amountInMaximum` to limit how much you're willing to pay:

```typescript
const pendingTx = await gSwap.swaps.swap(
  walletAddress,
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  FEE_TIER.PERCENT_01_00,
  {
    exactOut: '50', // Buy exactly 50 USDC
    amountInMaximum: '105', // Pay maximum 105 $GALA (5% slippage tolerance compared to our expected 100 $GALA)
  },
);
```

If more than 105 $GALA would be required, the transaction fails.

## Setting Slippage Tolerance

### Conservative (0.1% - 0.5%)

- Best for stable token pairs (stablecoins)
- Low volatility environments
- Risk: Higher chance of transaction failure

### Moderate (0.5% - 1.5%)

- Good for most token pairs
- Balanced approach between execution and protection
- Recommended for most users

### Aggressive (2% - 5%)

- Volatile token pairs
- Fast-moving markets
- Large trades in shallow pools
- Risk: Potential for significant value loss

## Best Practices

### Get Fresh Quotes

Always get a recent quote before executing large trades:

```typescript
// Get fresh quote for exact inpu
const quote = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  '100',
);

// Calculate slippage protection based on quote
const slippageTolerance = 0.01; // 1%
const amountOutMinimum = quote.outTokenAmount.multipliedBy(1 - slippageTolerance).toString();

// Execute with slippage protection
const pendingTx = await gSwap.swaps.swap(
  walletAddress,
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  quote.feeTier,
  {
    exactIn: '100',
    amountOutMinimum,
  },
);
```

### Consider Trade Size

- **Small trades**: Use tighter slippage (0.1-0.5%)
- **Large trades**: May need higher tolerance (1-3%)
- **Very large trades**: Consider splitting into smaller trades across the different fee tiers

### Monitor Pool Conditions

- Check pool liquidity before large trades
- Consider multiple fee tiers for better execution
- Be aware of market volatility

## Related Concepts

- **[Price Impact](./price-impact.md)** - How trade size affects execution price
- **[Liquidity](./liquidity-concentration.md)** - Understanding pool depth and concentration
- **[Fee Tiers](./fees.md)** - How different fee levels affect trading costs

Understanding slippage is crucial for successful trading on any AMM. Always use appropriate slippage protection and consider market conditions when setting tolerance levels.
