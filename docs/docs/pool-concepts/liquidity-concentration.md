---
sidebar_position: 3
---

# Liquidity Concentration

Liquidity concentration is a key feature of modern AMMs like gSwap (based on Uniswap V3) where liquidity providers can focus their capital within specific price ranges rather than across the entire price curve.

## How Liquidity Concentration Works

### Traditional AMMs vs Concentrated Liquidity

**Traditional AMMs (Uniswap V2 style):**

- Liquidity spread evenly across all possible prices (0 to ∞)
- Most liquidity sits far from current market price
- Capital inefficient but simple

**Concentrated Liquidity (Uniswap V3/gSwap style):**

- Liquidity providers choose specific price ranges
- Capital concentrated where trading actually happens
- Much more capital efficient

### Price Ranges and Ticks

Liquidity is provided within discrete price ranges defined by "ticks" (numbers for example purposes only):

```
Tick -2000: Price 0.45 USDC/GALA
Tick -1000: Price 0.47 USDC/GALA
Tick     0: Price 0.50 USDC/GALA ← Current Price
Tick  1000: Price 0.53 USDC/GALA
Tick  2000: Price 0.55 USDC/GALA
```

Each liquidity position covers a range between two ticks, e.g., from tick -1000 to tick +1000.

## Effects on Trading

### Active vs Inactive Ranges

**Within Active Ranges:**

- High liquidity concentration provides better prices
- Lower price impact for trades
- More efficient execution

**Outside Active Ranges:**

- Little to no liquidity available
- High price impact or impossible execution
- Trades may fail or get very poor prices

### Real-World Example

Consider a GALA/USDC pool where:

- Current price: 0.50 USDC per $GALA
- 100,000 $GALA of liquidity is in the range between 0.45-0.55 USDC
- Sparse liquidity outside this range

```typescript
// Trading within the concentrated range
const quote1 = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  '100', // Small trade
  FEE_TIER.PERCENT_01_00,
);
// Result: Low price impact, good execution

// Large trade that might exit the range
const quote2 = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  '1000000', // Large trade
  FEE_TIER.PERCENT_01_00,
);
// Result: Higher price impact as it moves through different liquidity zones
```

## Impact on Price Movement

### Liquidity Walls

Dense liquidity concentration creates "walls" that resist price movement:

- **Support Levels**: Heavy liquidity below current price
- **Resistance Levels**: Heavy liquidity above current price
- **Price Gaps**: Areas with little liquidity where price can move rapidly

### Breaking Through Ranges

When trades exhaust liquidity in a range:

1. **Price Impact Increases**: Less liquidity means worse prices
2. **Slippage Risk**: Rapid price movement through sparse areas
3. **Range Transitions**: Moving from high to low liquidity zones

```typescript
// Check multiple quote sizes to see how their price imacts differ
const tradeSizes = ['100', '1000', '10000', '100000'];

for (const size of tradeSizes) {
  const quote = await gSwap.quoting.quoteExactInput(
    'GALA|Unit|none|none',
    'GUSDC|Unit|none|none',
    size,
    FEE_TIER.PERCENT_01_00,
  );

  const impactPercent = quote.priceImpact.multipliedBy(100).toNumber();
  console.log(`${size} $GALA trade: ${impactPercent.toFixed(2)}% price impact`);
}
```

## Advanced Concepts

### Impermanent Loss in Concentrated Liquidity

Impermanent loss means your liquidity position becomes worth less than if you had simply held the original tokens separately. This happens because the AMM automatically rebalances your position as prices change, potentially selling the appreciating token and buying more of the depreciating token.

In concentrated liquidity, this works differently than traditional AMMs:

**Within Your Range:**

- You earn LP fees as trades happen through your position
- You experience impermanent loss as the AMM automatically adjusts your token balance to maintain the correct ratio for the current price
- Narrower ranges = higher fee earnings but greater exposure to impermanent loss

**Outside Your Range:**

- Your position stops earning fees
- You're fully converted to the token that's worth relatively less
- No trading happens in your position until price returns to your range

**Example:**

```
Position: 100 $GALA + 50 USDC in range $0.48-$0.52
If $GALA price rises above $0.52:
- Your position converts entirely to USDC (the "cheaper" token)
- You stop earning LP fees until price returns below $0.52
- You have impermanent loss vs just holding the original tokens
```

**Risk Management:**

- Wider ranges reduce impermanent loss but earn fewer LP fees
- When price moves near your range boundaries, you can:
  - Remove liquidity (realizing any impermanent loss) and add it back at a new range around the current price
  - Add additional liquidity at a new range while keeping your original position
  - Wait for the price to return to your original range
- LP fees can offset impermanent loss over time, especially in high-volume pairs

### Range Orders

Concentrated liquidity can simulate limit orders:

- **Buy Order**: Provide liquidity below current price
- **Sell Order**: Provide liquidity above current price
- **Automatic Execution**: Trade happens when price hits your range

### Full Range Liquidity

Providing liquidity between price $0 and $Infinity is known as providing liquidity across the full range. This spreads your liquidity across all possible prices, essentially replicating traditional AMM behavior.

**Advantages of Full Range:**

- **Never goes out of range** - Always earning LP fees regardless of price movement
- **Less active management** - Set it and forget it approach
- **Lower impermanent loss** - Spread across all prices reduces sensitivity to price changes

**Disadvantages of Full Range:**

- **Capital inefficiency** - Most of your liquidity sits far from current price where no trading happens
- **Lower fee earnings** - Your capital is diluted across the entire price curve
- **Opportunity cost** - Missing out on higher returns from concentrated positions

**When Full Range Makes Sense:**

- You want passive rewards without active management
- You're unsure about future price direction
- You're providing liquidity to a very volatile or unpredictable token pair
- You have a large amount of capital and want steady, predictable returns

**When Concentrated Ranges Are Better:**

- You have a strong view on likely price ranges
- You want to maximize fee earnings from your capital
- You're willing to actively manage your positions
- You're providing liquidity to a stable or predictable token pair

## Related Concepts

- **[Price Impact](./price-impact.md)** - How trade size affects execution price
- **[Slippage](./slippage.md)** - How market movement affects execution price
- **[Fees](./fees.md)** - How different fee levels attract different liquidity

Understanding liquidity concentration is crucial for efficient trading on modern AMMs. It explains why some trades execute with minimal impact while others face significant price movement, and helps inform better trading strategies.
