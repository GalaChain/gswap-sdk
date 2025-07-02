---
sidebar_position: 1
---

# Quoting

This guide will cover how to get price quotes for any token pair on gSwap before executing a trade.

In this example we will use both the `quoteExactInput` and `quoteExactOutput` methods to get quotes for **GALA - USDC**.

## Prerequisites

Make sure you've completed the [Getting Started](../getting-started.md) guide and have your SDK properly configured.

## Setting up the gSwap SDK

First, let's instantiate the SDK. Since quotes are read-only operations, we don't need a signer:

```typescript
import { GSwap, FEE_TIER } from '@galachain/gswap-sdk';

// Create GSwap instance for quotes (no signer needed)
const gSwap = new GSwap();

// Define our token pair
const GALA_TOKEN = 'GALA|Unit|none|none';
const USDC_TOKEN = 'GUSDC|Unit|none|none';
```

## Fetching Quotes for Exact Input

Use `quoteExactInput` when you want to know how much of the token you're buying (in this example USDC) you can get for a specified amount of the token you're selling ($GALA). By default, the SDK will check all available fee tiers and return the best quote:

```typescript
async function getExactInputQuote() {
  // Quote: "If I sell 100 $GALA, how much USDC will I get?" (uses best available pool)
  const quote = await gSwap.quoting.quoteExactInput(
    GALA_TOKEN, // Token to sell
    USDC_TOKEN, // Token to buy
    '100', // I want to sell exactly 100 $GALA
  );

  console.log('Quote Results:');
  console.log(`Best fee tier found: ${quote.feeTier}`);
  console.log(`Selling: ${quote.inTokenAmount} $GALA`);
  console.log(`Receiving: ${quote.outTokenAmount} USDC`);
  console.log(`Current price (USDC per $GALA): ${quote.currentPrice}`);
  console.log(`New price if we execute this swap (USDC per $GALA): ${quote.newPrice}`);
  console.log(`Price impact if we execute this swap: ${quote.priceImpact.multipliedBy(100)}%`);
}
```

### Specifying a Specific Fee Tier

If you want to get a quote from a specific fee tier instead of automatically finding the best one, you can pass the fee tier as the last parameter:

```typescript
async function getSpecificFeeQuote() {
  // Quote from the 1% fee tier specifically
  const quote = await gSwap.quoting.quoteExactInput(
    GALA_TOKEN, // Token to sell
    USDC_TOKEN, // Token to buy
    '100', // I want to sell exactly 100 $GALA
    FEE_TIER.PERCENT_01_00, // Use 1% fee tier specifically
  );

  console.log(`Quote from ${quote.feeTier} fee tier:`);
  console.log(`Selling: ${quote.inTokenAmount} $GALA`);
  console.log(`Receiving: ${quote.outTokenAmount} USDC`);
}
```

## Fetching Quotes for Exact Output

Use `quoteExactOutput` when you want to know how much of the token you're selling (in this example $GALA) you need to sell in order to receive a specific amount of the token you're buying (USDC). Like `quoteExactInput`, this will automatically find the best available pool:

```typescript
async function getExactOutputQuote() {
  // Quote: "If I want to receive 50 USDC, how much $GALA do I need to sell?" (uses best available pool)
  const quote = await gSwap.quoting.quoteExactOutput(
    GALA_TOKEN, // Token to sell
    USDC_TOKEN, // Token to buy
    '50', // I want to buy exactly 50 USDC
  );

  console.log('Quote Results:');
  console.log(`Best fee tier found: ${quote.feeTier}`);
  console.log(`Selling: ${quote.inTokenAmount} $GALA`);
  console.log(`Receiving: ${quote.outTokenAmount} USDC`);
  console.log(`Current price (USDC per $GALA): ${quote.currentPrice}`);
  console.log(`New price if we execute this swap (USDC per $GALA): ${quote.newPrice}`);
  console.log(`Price impact if we execute this swap: ${quote.priceImpact.multipliedBy(100)}%`);
}
```

## Understanding Quote Results

The quote response includes several important fields:

```typescript
interface GetQuoteResult {
  // Token amounts involved in the swap
  inTokenAmount: BigNumber; // Amount of input (selling) token
  outTokenAmount: BigNumber; // Amount of output (buying) token

  // The fee tier that provided this quote (when auto-selecting best pool)
  feeTier: FEE_TIER; // Fee tier used for this quote

  // Current and new prices in terms of how many of the output (buying) token
  // one unit of the input (selling) token can buy.
  currentPrice: BigNumber; // Current price
  newPrice: BigNumber; // New price if you actually execute this swap

  // Proportional price impact if you execute this trade.
  // For example if this value is 0.03, it means the price of the buying token
  // will increase by 3%.
  priceImpact: BigNumber;

  // Raw pool square root price information. Can be useful for some advanced use cases,
  // but typically you'll want to look at currentPrice and newPrice instead.
  currentPoolSqrtPrice: BigNumber; // Current pool price (square root)
  newPoolSqrtPrice: BigNumber; // New price if you execute this trade

  // Raw token amount information. Can be useful for some advanced use cases,
  // but typically you'll want to look at inTokenAmount and outTokenAmount instead.
  amount0: BigNumber;
  amount1: BigNumber;
}
```

## Important Notes

### Quote Accuracy

- Quotes are accurate at the time of the call but may change rapidly as other trades occur.
- For large trades or volatile markets, get a fresh quote right before executing, and make sure to use slippage protection.
- Consider the time between quote and execution when setting slippage tolerance.

### Fee Considerations

- Fetching a quote does not incur any fee.
- Protocol fees are already included in the quote amounts, so you don't need to account for them separately.
- Gas fees are **not** included in the quote amounts. However, gas fees are stable and are rarely changed. At the time of this writing, each swap costs exactly 1 $GALA in gas fees.

### Pool Liquidity

- Quotes will fail if no pool exists for the specified token pair and fee tier.
- Large trades may have significant price impact in low-liquidity pools.
- For large trades, consider splitting into smaller trades across different fee tiers as this may result in an overall better execution price.

## Next Steps

- **[Asset Balances](./asset-balances.md)** - Learn how to check your token balances
- **[Swapping Guide](./trading.md)** - Learn how to execute swaps using your quotes
