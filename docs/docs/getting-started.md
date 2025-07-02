---
sidebar_position: 2
---

# Getting Started

This guide will help you get started with integrating gSwap into your applications.

## Installation

Install the gSwap SDK using npm:

```bash
npm install @galachain/gswap-sdk
```

## Node.js Setup

For server-side applications, use the `PrivateKeySigner` with a GalaChain private key:

```typescript
import { GSwap, PrivateKeySigner } from '@galachain/gswap-sdk';

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
  'eth|123...abc', // Your wallet address
  'GALA|Unit|none|none', // Token to sell
  'GUSDC|Unit|none|none', // Token to buy
  quote.feeTier, // Use the fee tier from the quote
  {
    exactIn: '100', // Sell exactly 100 $GALA
    amountOutMinimum: quote.outTokenAmount.multipliedBy(0.98), // Accept at least 98% of the quoted amount (slippage protection)
  },
);

console.log('Swap transaction initiated:', transaction);
```

:::warning Security Tip
Never hardcode private keys in your source code! Consider using environment variables or a secrets vault service to manage sensitive information securely.
:::

## Browser Setup

For browser applications, use the `GalaWalletSigner` to integrate with Gala Wallet:

### Complete HTML Example

Here's a complete HTML page that demonstrates wallet connection and token swapping:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>gSwap Demo</title>
  </head>
  <body>
    <h1>gSwap Demo</h1>

    <div id="status"></div>

    <button onclick="connectAndSwap()">Connect Wallet & Swap 100 $GALA for USDC</button>

    <script type="module">
      import {
        GSwap,
        GalaWalletSigner,
      } from 'https://unpkg.com/@galachain/gswap-sdk@1/dist/browser/index.js';

      window.connectAndSwap = connectAndSwap;

      async function connectAndSwap() {
        const statusEl = document.getElementById('status');

        try {
          statusEl.textContent = 'Connecting to wallet...';

          if (!window.gala) {
            throw new Error('Gala Wallet not found. Please install the Gala Wallet extension.');
          }

          // Connect wallet
          const accounts = await window.gala.request({
            method: 'eth_requestAccounts',
          });

          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
          }

          const walletAddress = accounts[0];
          statusEl.textContent = `Connected: ${walletAddress}. Executing swap...`;

          // Create GSwap instance
          const walletSigner = new GalaWalletSigner(walletAddress);
          const gSwap = new GSwap({ signer: walletSigner });

          // Execute swap
          const result = await gSwap.swaps.swap(
            walletAddress,
            'GALA|Unit|none|none',
            'GUSDC|Unit|none|none',
            500,
            {
              exactIn: '100',
              amountOutMinimum: '45',
            },
          );

          statusEl.textContent = `Swap successful! Transaction: ${result.txId || 'pending'}`;
        } catch (error) {
          statusEl.textContent = `Error: ${error.message}`;
        }
      }
    </script>
  </body>
</html>
```

### Browser Requirements

For Gala Wallet integration to work properly:

1. **HTTPS Required** - Gala Wallet only injects on secure pages. For local development use tooks like ngrok or self-signed certificates.
2. **Gala Wallet Extension** - Users need the Gala Wallet browser extension installed.

## Next Steps

Now that you have the SDK set up, explore these guides to learn more:

- **[Quoting Guide](./tutorial-basics/quoting.md)** - Learn how to get price quotes
- **[Asset Balances](./tutorial-basics/asset-balances.md)** - Learn how to check your token balances
