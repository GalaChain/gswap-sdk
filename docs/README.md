# gSwap SDK

A TypeScript SDK for interacting with the gSwap decentralized exchange on GalaChain.

This is the API reference documentation, containing detailed information about the classes, methods, and types available in the SDK. Use the sidebar to navigate through the API documentation, or visit the [Getting Started Guide](../getting-started) for guided usage instructions.

## Example SDK Usage

```bash
npm install @gala-chain/gswap-sdk
```

```typescript
import { GSwap, PrivateKeySigner } from '@gala-chain/gswap-sdk';

const gSwap = new GSwap({
  signer: new PrivateKeySigner('your-private-key'),
});

const USDC_SELLING_AMOUNT = 10; // Amount of USDC to sell

// Quote how much $GALA you can get for 10 USDC
const quote = await gSwap.quoting.quoteExactInput(
  'GUSDC|Unit|none|none',
  'GALA|Unit|none|none',
  USDC_SELLING_AMOUNT,
);

console.log(`Best rate found on ${quote.feeTier} fee tier pool`);

// Execute a swap using the best fee tier from the quote
const result = await gSwap.swap(
  'GUSDC|Unit|none|none',
  'GALA|Unit|none|none',
  quote.feeTier,
  {
    exactIn: USDC_SELLING_AMOUNT,
    amountOutMinimum: quote.outTokenAmount.multipliedBy(0.95), // 5% slippage
  },
  'eth|123...abc', // your wallet address
);
```
