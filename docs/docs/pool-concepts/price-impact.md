---
sidebar_position: 2
---

# Price Impact

Price impact is the change in token price caused by your trade, and is a closely related concept to slippage.

## How Price Impact Works

### Constant Product Formula

AMMs like gSwap use the constant product formula: `x * y = k`

- `x` = amount of token A in the pool
- `y` = amount of token B in the pool
- `k` = constant that must be maintained

When you trade, you're changing the ratio of tokens in the pool, which changes the price.

### Example: Price Impact Calculation

Starting pool state:

- 1,000 $GALA tokens
- 500 USDC tokens
- 1,000 \* 500 = 500,000 (constant k)
- Current price: 0.5 USDC per $GALA

If you sell 100 $GALA you will receive ~45.5 USDC:

- Pool becomes: 1,100 $GALA, ~454.5 USDC
- 1,100 \* ~454.5 = 500,000 (still same constant k)
- New price: ~0.413 USDC per $GALA
- Price impact: ~17.4%

## Factors Affecting Price Impact

### Trade Size vs Pool Size

The ratio of your trade to the pool's total liquidity determines impact:

```
Price Impact ≈ (Trade Size / Pool Liquidity) * scaling_factor
```

**Examples:**

- Trading $100 in a $1M pool: ~0.01% impact
- Trading $100 in a $10K pool: ~1% impact
- Trading $100 in a $1K pool: ~10%+ impact

### Pool Liquidity Distribution

In concentrated liquidity pools (like Uniswap V3/gSwap), liquidity isn't evenly distributed:

- **Active Range**: Liquidity concentrated around current price
- **Out of Range**: Less liquidity available at extreme prices
- **Tick Density**: How much liquidity exists at each price level

### Fee Tier Selection

Different fee tiers often have different liquidity depths:

- **0.05% pools**: Usually for very stable pairs, less liquidity
- **0.3% pools**: Most common, good liquidity for many pairs
- **1.0% pools**: Volatile pairs, may have concentrated liquidity

## Minimizing Price Impact

### When Trade Splitting Helps

**Note**: In a simple AMM with no other activity, splitting trades doesn't reduce total price impact - the cumulative effect is the same. However, splitting can help in these scenarios:

#### Allow Arbitrage Between Trades

By waiting between smaller trades, arbitrageurs can restore the pool price closer to external market prices:

```typescript
// Split trades with delays to allow arbitrage
const tradeSize = '100';
const numTrades = 10;

for (let i = 0; i < numTrades; i++) {
  const pendingTx = await gSwap.swaps.swap(
    walletAddress,
    'GALA|Unit|none|none',
    'GUSDC|Unit|none|none',
    FEE_TIER.PERCENT_01_00,
    {
      exactIn: tradeSize,
      amountOutMinimum: calculateMinimum(tradeSize),
    },
  );

  await pendingTx.wait();

  // Wait for potential arbitrage to restore price
  await new Promise((resolve) => setTimeout(resolve, 5000));
}
```

#### Benefit from Concentrated Liquidity Ranges

In concentrated liquidity pools, different price ranges have different liquidity depths. Smaller trades may stay within high-liquidity ranges:

- **Large trade**: May exhaust concentrated liquidity and move into sparse ranges
- **Small trades**: Each trade may complete within the concentrated range

## Estimating Price Impact

### Before Trading

Always get a recent quote to understand the expected price impact:

```typescript
// For exact input (selling a specific amount) - automatically finds best pool
const quote = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  '100',
);

console.log(`Best fee tier: ${quote.feeTier}`);
console.log(`Current price: ${quote.currentPrice.toString()} USDC per $GALA`);
console.log(`New price after trade: ${quote.newPrice.toString()} USDC per $GALA`);
console.log(`Expected output: ${quote.outTokenAmount.toString()} USDC`);
console.log(`Price impact: ${quote.priceImpact.multipliedBy(100).toFixed(2)}%`);
```

## Price Impact vs Slippage

### Key Differences

| Aspect             | Price Impact                                       | Slippage                         |
| ------------------ | -------------------------------------------------- | -------------------------------- |
| **Cause**          | Your trade size                                    | Market movement + your trade     |
| **Predictability** | Calculable from pool state                         | Unpredictable                    |
| **Control**        | Reduce by smaller trades or splitting across pools | Mitigate with tolerance settings |

## Best Practices

### Pre-Trade Analysis

1. **Check pool liquidity** across different fee tiers
2. **Calculate expected price impact** using quotes
3. **Consider trade splitting** for large amounts
4. **Monitor market conditions** and volatility

### During Execution

1. **Use appropriate slippage protection** accounting for price impact
2. **Monitor transaction status** for unexpected failures
3. **Be prepared to adjust** strategy if conditions change

### Post-Trade Review

1. **Compare actual vs expected** execution
2. **Analyze price impact accuracy** from quotes
3. **Learn from results** to improve future trading

## Related Concepts

- **[Slippage](./slippage.md)** - How market movement affects execution price
- **[Liquidity Concentration](./liquidity-concentration.md)** - Understanding pool depth and concentration
- **[Fees](./fees.md)** - How fees interact with liquidity provision

Price impact is a fundamental cost of trading on AMMs. Understanding and minimizing it through proper trade sizing and timing is crucial for efficient trading.
