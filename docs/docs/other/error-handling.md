---
sidebar_position: 1
---

# Error Handling

The GalaSwap SDK uses a custom error class `GSwapSDKError` for many error conditions. This provides consistent error handling and additional context for debugging.

## GSwapSDKError

Errors thrown by the SDK are instances of `GSwapSDKError`, which extends the standard JavaScript `Error` class.

### Properties

#### `code: string`

A unique error code that identifies the type of error. This allows you to programmatically handle different error conditions.

#### `details?: Record<string, unknown>`

An optional object containing additional details about the error, such as:

- Transaction IDs for transaction-related errors
- HTTP response data (when an HTTP request fails)
- Invalid parameters that caused the error

### Common Error Codes

| Code                       | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| `NO_SIGNER`                | Operation requires a signer but none was provided    |
| `NO_POOL_AVAILABLE`        | No liquidity pool found for the specified token pair |
| `TRANSACTION_WAIT_TIMEOUT` | Transaction confirmation timed out                   |
| `INVALID_TOKEN_CLASS_KEY`  | Invalid token identifier format                      |
| `INCORRECT_TOKEN_ORDERING` | Tokens are not in the correct order                  |
| `VALIDATION_ERROR`         | Miscellaneous validation error                       |

### Usage Example

```typescript
import { GSwap, GSwapSDKError } from '@galachain-dex-sdk/galaswap-sdk';

try {
  const quote = await gSwap.quoting.quoteExactInput({
    tokenIn: 'GALA|Unit|none|none',
    tokenOut: 'SILK|Unit|none|none',
    amountIn: '100',
  });
} catch (error) {
  if (error instanceof GSwapSDKError) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Error details:', error.details);

    // Handle specific error types
    switch (error.code) {
      case 'NO_POOL_AVAILABLE':
        console.log('No pool found for this token pair');
        break;
      case 'QUOTE_REQUEST_FAILED':
        console.log('API request failed:', error.details?.status);
        break;
      default:
        console.log('Unexpected error:', error.message);
    }
  } else {
    // Handle non-SDK errors
    console.log('Unexpected error:', error);
  }
}
```

### Best Practices

1. **Always check error codes**: Use the `code` property to handle different error conditions appropriately.

2. **Examine error details**: The `details` property often contains useful information for debugging.

3. **Use instanceof checks**: Always verify that an error is a `GSwapSDKError` before accessing SDK-specific properties.

4. **Log full error context**: Consider using a package like [serialize-error](https://www.npmjs.com/package/serialize-error) to serialize errors.
