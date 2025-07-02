---
sidebar_position: 4
---

# Executing Swaps

This guide will cover how to execute token swaps on gSwap. We'll show you both exact input swaps (sell a specific amount) and exact output swaps (buy a specific amount).

If you haven't already, please read the [Getting Started guide](../getting-started.md) first to install the gSwap SDK.

## Prerequisites

Before executing swaps, you should:

- Complete the [Getting Started](../getting-started.md) guide and have your SDK properly configured.
- Understand how to [get quotes](./quoting.md) for price estimates
- Read the [Transaction Status Monitoring](./transaction-status.md) guide to understand connection management and transaction waiting
- Have a wallet with sufficient token balance

## Setting up the gSwap SDK

Unlike quoting, which is read-only, swaps require a signer to authenticate transactions. Waiting for your transactions to complete also requires establishing a connection to the event socket.

```typescript
import { GSwap, FEE_TIER, PrivateKeySigner } from '@gala-chain/gswap-sdk';

// Connect to the event socket (once globally)
await GSwap.events.connectEventSocket();

// Create instance with signer
const signer = new PrivateKeySigner('your-private-key-here');
const gSwap = new GSwap({ signer });

// Define our token pair
const GALA_TOKEN = 'GALA|Unit|none|none';
const USDC_TOKEN = 'GUSDC|Unit|none|none';
const WALLET_ADDRESS = 'eth|123...abc'; // Your wallet address
```

## Exact Input Swaps

Use exact input swaps when you want to sell a specific amount of input tokens and receive at least a specified minimum amount of output tokens in return:

```typescript
async function swapExactInput() {
  const pendingTx = await gSwap.swaps.swap(
    WALLET_ADDRESS,
    GALA_TOKEN, // Token to sell
    USDC_TOKEN, // Token to buy
    FEE_TIER.PERCENT_01_00, // 1% fee tier
    {
      exactIn: '100', // Sell exactly 100 $GALA
      amountOutMinimum: '45', // Accept minimum 45 USDC (slippage protection)
    },
  );

  console.log('Swap transaction submitted:', pendingTx.transactionId);

  // Wait for transaction to complete
  const result = await pendingTx.wait();
  console.log('Swap completed successfully!', result);

  return result;
}
```

## Exact Output Swaps

Use exact output swaps when you want to buy a specific amount of output tokens and are willing to sell up to a specified maximum amount of input tokens:

```typescript
async function swapExactOutput() {
  const buyAmount = '50'; // Want to buy exactly 50 USDC

  // Execute the swap with slippage protection
  const pendingTx = await gSwap.swaps.swap(
    WALLET_ADDRESS,
    GALA_TOKEN, // Token to sell
    USDC_TOKEN, // Token to buy
    FEE_TIER.PERCENT_01_00, // 1% fee tier
    {
      exactOut: buyAmount, // Buy exactly 50 USDC
      amountInMaximum: '110', // Maximum 110 $GALA to sell (slippage protection)
    },
  );

  console.log('Swap transaction submitted:', pendingTx.transactionId);

  // Wait for transaction to complete
  const result = await pendingTx.wait();
  console.log('Swap completed successfully!', result);

  return result;
}
```

## Tips for Successful Swaps

### Transaction Timing

- Get quotes before executing to understand expected amounts (see [Quoting guide](./quoting.md)).
- Consider the time between quote and execution when setting slippage.
- Most swaps confirm within 2-3 seconds, but high network activity may sometimes delay transactions.

### Slippage Protection

- **Too tight**: Transaction may fail if price moves slightly.
- **Too loose**: You may receive less than expected.
- **Recommended**: 0.5-1% for stable pairs, 1-3% for volatile pairs.

### Gas and Fees

- Swaps require gas fees and protocol fees for transaction execution.
- Fees are automatically deducted from your trade.
- Factor in costs when evaluating trade profitability.

## Next Steps

- **[Liquidity Management](./liquidity-management.md)** - Learn how to provide liquidity and earn fees
- **[Asset Balances](./asset-balances.md)** - Check your token balances after trading
