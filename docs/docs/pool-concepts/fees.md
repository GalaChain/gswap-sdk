---
sidebar_position: 4
---

# Fees

gSwap has two types of fees: gas fees for executing transactions, and protocol fees when swapping.

## Gas Fees

Operations on GalaChain, including gSwap transactions, require gas fees paid in $GALA. This is a standard requirement for executing most transactions on GalaChain. Gas fees support the overall GalaChain network.

For gSwap transactions in particular, the gas fee is currently 1 $GALA per transaction. This applies to all write operations that change the state of the blockchain (e.g., swaps, adding/removing liquidity, collecting fees, etc). This is a fixed cost per transaction and the fee is automatically deducted from your $GALA balance. Gas fees are set by the GalaChain team and may change in the future, but any changes are expected to be infrequent and communicated in advance.

```typescript
// Every gSwap WRITE operation costs 1 $GALA in gas
const swapTx = await gSwap.swaps.swap(/* params */); // Costs 1 $GALA
const addLiquidityTx = await gSwap.positions.addLiquidityByTicks(/* params */); // Costs 1 $GALA
const collectTx = await gSwap.positions.collectPositionFees(/* params */); // Costs 1 $GALA
// others...
```

Make sure you have sufficient $GALA in your wallet to cover gas fees before executing transactions. **Gas fees are not included in quotes** - you need to account for them separately.

Readonly operations such as fetching quotes, checking balances, or reading pool data do not incur gas fees.

## Protocol Fees

The protocol fee is a separate fee to incentivize liquidity providers and the protocol operator. Protocol fees are charged on swaps and are based on a percentage of swap size.

### Protocol Fee Tiers

Each liquidity pool uses one of the three "fee tiers" which defines the protocol fee percentage for the pool. Each token pair can have multiple pools with different fee tiers, and traders can choose which pool to use based on their needs.

gSwap offers several fee tiers:

| Fee Tier  | Fee Percentage | Typical Use Case           |
| --------- | -------------- | -------------------------- |
| **500**   | 0.05%          | Stable pairs (stablecoins) |
| **3000**  | 0.30%          | Balanced                   |
| **10000** | 1.00%          | Volatile pairs             |

The protocol fee is charged on the input amount (the amount you are selling). For example if you sell 1,000 USDC for 50,000 $GALA in the 1% fee pool, 10 of your USDC will be taken as protocol fees, and the other 990 will be swapped for $GALA.

## Fee Tier Selection

### For Traders

Different fee tiers often have different liquidity depths and price impact:

```typescript
import { FEE_TIER } from '@gala-chain/gswap-sdk';

// First, check what the SDK recommends automatically
const autoQuote = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  '1000',
);

console.log(`SDK automatically selected ${autoQuote.feeTier} fee tier`);
console.log(`Output: ${autoQuote.outTokenAmount.toString()} USDC`);

// Compare execution across fee tiers manually
const tiers = [FEE_TIER.PERCENT_00_05, FEE_TIER.PERCENT_00_30, FEE_TIER.PERCENT_01_00];

for (const tier of tiers) {
  const quote = await gSwap.quoting.quoteExactInput(
    'GALA|Unit|none|none',
    'GUSDC|Unit|none|none',
    '1000',
    tier,
  );

  const feePercent = tier / 10000; // Convert to percentage
  console.log(`${feePercent}% tier: ${quote.outTokenAmount.toString()} USDC output`);
  console.log(`Price impact: ${quote.priceImpact.multipliedBy(100).toFixed(2)}%`);
}
```

### Choosing the Right Tier

**0.05% Tier (500):**

- Best for very stable pairs (USDC/USDT, etc.)
- Lowest protocol fees but may have less liquidity
- Tight spreads when liquidity is available

**0.30% Tier (3000):**

- Good balance of protocol fees and liquidity

**1.00% Tier (10000):**

- Typical for more volatile pairs
- Higher protocol fees compensate liquidity providers for risk

All else equal, swappers like lower protocol fee pools because they don't have to pay as much in trading costs, while liquidity providers prefer higher protocol fee pools because they earn more per trade. The token pair's stability helps decide which direction that tug-of-war goes, as liquidity providers are cautious about accepting low fees for pairs that are volatile.

### Protocol Fee Calculation

Protocol fees are charged on the input amount and are **automatically included in quote calculations**:

```typescript
// For a 1000 $GALA trade on 1.00% tier
const inputAmount = 1000;
const feeRate = 0.01; // 1.00%
const feeAmount = inputAmount * feeRate; // 10 $GALA goes to the protocol fee
const amountAfterFees = inputAmount - feeAmount; // 990 $GALA actually traded

// When you get a quote for 1000 $GALA input:
const quote = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none',
  'GUSDC|Unit|none|none',
  '1000',
  FEE_TIER.PERCENT_01_00, // Specify 1% fee tier manually
);
// The quote.outTokenAmount already reflects that only 990 $GALA
// will be traded (after 10 $GALA protocol fee is deducted)
```

:::info Fee Inclusion in Quotes
Protocol fees are included in quotes, but gas fees are not. You'll need to account for the 1 $GALA gas fee separately when planning transactions.
:::

### Protocol fee Distribution

Part of the protocol fees go to liquidity providers, while the rest goes to the protocol operator. Typically 90% of the fees go to liquidity providers and 10% to the protocol operator, but this can vary by pool.

Liquidity providers earn protocol fees when their liquidity is used in trades. Fees can be collected at any time.

## Best Practices

### For Traders

1. **Always compare tiers** before large trades
2. **Consider the factors that influence trading return** (gas fees, protocol fees, slippage, price impact)
3. **Remember**: Protocol fees are included in quotes, but gas fees are not

### For Liquidity Providers

1. **Consider pair volatility** when choosing a protocol fee tier
2. **Consider trading volume** vs protocol fee rate
3. **Monitor competing liquidity** in other tiers
4. **Consider collecting** and reinvesting protocol fees periodically

## Related Concepts

- **[Price Impact](./price-impact.md)** - How trade size affects execution price
- **[Slippage](./slippage.md)** - How market movement affects execution price
- **[Liquidity Concentration](./liquidity-concentration.md)** - How liquidity is distributed across price ranges

Protocol fee tiers provide flexibility for both traders and liquidity providers to optimize for their specific needs, whether that's minimizing costs, maximizing returns, or accessing the deepest liquidity.

Understanding both gas fees and protocol fees is important for calculating the total cost of gSwap operations.
