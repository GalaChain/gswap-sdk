---
sidebar_position: 3
---

# Transaction Status Monitoring

This guide covers how to monitor transaction status using gSwap's WebSocket connection.

## Prerequisites

Make sure you've completed the [Getting Started](../getting-started.md) guide and have your SDK properly configured.

## Global Connection Management

GSwap uses a shared global WebSocket connection for all instances. Call `GSwap.events.connectEventSocket()` during application initialization:

```typescript
import { GSwap } from '@gala-chain/gswap-sdk';

// Application initialization
await GSwap.events.connectEventSocket();
```

When your application shuts down, clean up the connection:

```typescript
// Application cleanup
GSwap.events.disconnectEventSocket();
```

## Transaction Waiting

After connecting, you can use the `wait()` method on any transaction to monitor its status:

```typescript
const pendingTx = await gSwap.swaps.swap(/* params */);
const result = await pendingTx.wait();
console.log('Transaction completed!', result);
```

The `wait()` method will throw an error if you have not connected to the event socket first (or if you have and the transaction fails or times out).

Note that a timeout does not _necessarily_ mean that the transaction failed. If the connection to the event socket is unstable then the event may not be received, or the transaction may take longer than expected to be processed.

## Manual Transaction Event Monitoring

For advanced use cases, you can listen to WebSocket events directly:

```typescript
// Get the socket client for manual event listening
const socketClient = await GSwap.events.connectEventSocket();

// Listen to all transaction events
socketClient.on('transaction', (transactionId: string, response: BundlerResponse) => {
  console.log(`Transaction ${transactionId} status: ${response.status}`);

  if (response.status === 'PROCESSED') {
    console.log('Transaction completed:', response.data);
  } else if (response.status === 'FAILED') {
    console.error('Transaction failed:', response.error);
  }
});
```

Note that the socket may receive events for transactions submitted by wallets other than your own. Filter by `transactionId` if you only want to monitor specific transactions.
