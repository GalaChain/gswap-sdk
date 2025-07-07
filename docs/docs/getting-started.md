---
sidebar_position: 2
---

# Getting Started

This guide will help you get started with integrating gSwap into your applications.

## Installation

Install the gSwap SDK using npm:

```bash
npm install @gala-chain/gswap-sdk
```

## Node.js Setup

For server-side applications, use the `PrivateKeySigner` with a GalaChain private key:

```typescript
import { GSwap, PrivateKeySigner } from '@gala-chain/gswap-sdk';

const signer = new PrivateKeySigner('your-private-key-here');

const gSwap = new GSwap({ signer });

// Example: Get a price quote (automatically finds best pool)
const quote = await gSwap.quoting.quoteExactInput(
  'GALA|Unit|none|none', // Token to sell
  'GUSDC|Unit|none|none', // Token to buy
  '100', // Amount to sell
);

console.log(
  `Selling 100 $GALA will get you ${quote.outTokenAmount} USDC via ${quote.feeTier} fee tier`,
);

// Example: Execute a swap using the fee tier from the quote
const transaction = await gSwap.swaps.swap(
  'GALA|Unit|none|none', // Token to sell
  'GUSDC|Unit|none|none', // Token to buy
  quote.feeTier, // Use the fee tier from the quote
  {
    exactIn: '100', // Sell exactly 100 $GALA
    amountOutMinimum: quote.outTokenAmount.multipliedBy(0.98), // Accept at least 98% of the quoted amount (slippage protection)
  },
  'eth|123...abc', // your wallet address
);

console.log('Swap transaction initiated:', transaction);
```

:::warning Security Tip
Never hardcode private keys in your source code! Consider using environment variables or a secrets vault service to manage sensitive information securely.
:::

## Browser Setup

### Installation

```bash
npm install @gala-chain/gswap-sdk
```

You will also need `process` and `crypto` polyfills. The details will depend on your build setup, but for example with Vite you can install:

```bash
npm install vite-plugin-node-polyfills
```

And then add:

```javascript
nodePolyfills({ include: ['process', 'crypto'] });
```

To your `plugins` array in `vite.config.js`.

### Signing

For browser applications, use the `GalaWalletSigner` to integrate with Gala Wallet:

```javascript
import { GSwap, GalaWalletSigner } from '@gala-chain/gswap-sdk';

const walletSigner = new GalaWalletSigner(address);
const swapInstance = new GSwap({
  signer: walletSigner,
});
```

### React Example

You can find an example React application [here](https://github.com/GalaChain/gswap-sdk/tree/main/examples/full_dex).

### Browser Requirements

For Gala Wallet integration to work properly:

1. **HTTPS Required** - Gala Wallet only injects on secure pages. For local development use tooks like ngrok or self-signed certificates.
2. **Gala Wallet Extension** - Users need the Gala Wallet browser extension installed.

## Next Steps

Now that you have the SDK set up, explore these guides to learn more:

- **[Quoting Guide](./tutorial-basics/quoting.md)** - Learn how to get price quotes
- **[Asset Balances](./tutorial-basics/asset-balances.md)** - Learn how to check your token balances
