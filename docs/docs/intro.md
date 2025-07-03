---
sidebar_position: 1
---

# gSwap SDK

Welcome to the **gSwap SDK** documentation. This SDK provides a comprehensive TypeScript interface for interacting with the gSwap decentralized exchange on GalaChain.

## Quick Navigation

🚀 **[Getting Started Guide](/docs/getting-started)** - Complete setup instructions for Node.js and browser environments.

🎯 **[Tutorials](category/tutorial)** - Walk through the major SDK features.

💡 **[Examples Repo](https://gitlab.com/gala-games/defi/dex/sdk/-/tree/dev/examples/cli?ref_type=heads)** - Complete working examples and sample projects (TODO: Link to GitHub when examples repo is published there).

⚖️ **[Uniswap Comparison](/docs/uniswap-comparison)** - For developers familiar with Uniswap.

📚 **[API Documentation](/docs/api/)** - Comprehensive API reference.

## What is gSwap?

gSwap is a high-performance decentralized exchange built on GalaChain, offering:

- **Fast & Low-Cost Trading** - Near-instant transactions with minimal, consistent fees
- **Secure** - Industry leading mitigation against MEV attacks
- **Ease of Use** - gSwap is built on GalaChain and many blockchain concepts such as gas fees are simplified

## Quick Example

```typescript
import { GSwap, PrivateKeySigner } from '@gala-chain/gswap-sdk';

const gSwap = new GSwap({
  signer: new PrivateKeySigner('your-private-key'),
});

const USDC_SELLING_AMOUNT = 10; // Amount of USDC to sell

// Quote how much $GALA you can get for 10 USDC
const quote = await gSwap.quoting.quoteExactInput(
  'GUSDC|Unit|none|none', // Token to sell
  'GALA|Unit|none|none', // Token to buy
  USDC_SELLING_AMOUNT,
);

// Execute a swap using the fee tier from the quote
const transaction = await gSwap.swaps.swap(
  'GUSDC|Unit|none|none', // Token to sell
  'GALA|Unit|none|none', // Token to buy
  quote.feeTier, // Use the fee tier from the quote
  {
    exactIn: USDC_SELLING_AMOUNT,
    amountOutMinimum: quote.outTokenAmount.multipliedBy(0.95), // 5% slippage
  },
  'eth|123...abc', // your wallet address
);
```

Ready to get started? Head over to the **[Getting Started Guide](/docs/getting-started)** for complete setup instructions!

## Disclaimer

This SDK is provided under the Apache License 2.0. Gala™, GalaChain™, and related marks are trademarks of Blockchain Game Partners Inc. No license to use these trademarks is granted under this license. This SDK is provided “AS IS” without warranties of any kind. Use it at your own risk. Gala Games does not endorse or guarantee any third-party use or implementation of this SDK.
