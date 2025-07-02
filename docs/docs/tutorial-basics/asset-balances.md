---
sidebar_position: 2
---

# Asset Balances

Learn how to fetch asset (token) balances using the gSwap SDK.

## Prerequisites

Make sure you've completed the [Getting Started](../getting-started.md) guide and have your SDK properly configured.

## Fetching User Assets

Use the `getUserAssets()` method to retrieve all tokens owned by a wallet:

```typescript
import { GSwap } from '@gala-chain/gswap-sdk';

const gSwap = new GSwap();

// Get wallet's token balances
const assets = await gSwap.assets.getUserAssets(
  'eth|6cd13b1c31B4E489788F61f2dbf854509D608F42', // wallet address
  1, // page number (optional, default: 1)
  20, // limit per page (optional, default: 10)
);

console.log(`Wallet has ${assets.count} different tokens`);

// Display each token
assets.tokens.forEach((token) => {
  console.log(`${token.symbol}: ${token.quantity} (${token.name})`);
  console.log(`  Decimals: ${token.decimals}`);
  console.log(`  Image: ${token.image}`);
});
```

## Pagination

For users with many tokens, use pagination to manage large result sets:

```typescript
const page1 = await gSwap.assets.getUserAssets(userAddress, 1, 10);
const page2 = await gSwap.assets.getUserAssets(userAddress, 2, 10);

...
```

## Next Steps

- **[Swapping](./trading.md)**: Learn how to execute token swaps
- **[Liquidity Management](./liquidity-management.md)**: Add and remove liquidity from pools
