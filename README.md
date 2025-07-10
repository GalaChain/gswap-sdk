# gSwap SDK

A TypeScript SDK for interacting with the gSwap decentralized exchange on GalaChain.

⚠️ Note that documented APIs for gSwap are undergoing finalization. As a result, this version of the SDK may be deprecated in the near future. Please be prepared to upgrade to a newer version when available.

## Documentation

Visit [the documentation](https://galachain.github.io/gswap-sdk/docs/intro) for detailed guides and API references.

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

## Disclaimer

This SDK is provided under the Apache License 2.0. Gala™, GalaChain™, and related marks are trademarks of Blockchain Game Partners Inc. No license to use these trademarks is granted under this license. This SDK is provided “AS IS” without warranties of any kind. Use it at your own risk. Gala Games does not endorse or guarantee any third-party use or implementation of this SDK.
