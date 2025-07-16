/**
 * @hideconstructor
 * Represents a pending blockchain transaction.
 *
 * Usage: Call `wait()` immediately after receiving the PendingTransaction
 * to ensure proper event handling:
 *```typescript
 * const pendingTx = await gSwap.swap(...);
 * const result = await pendingTx.wait(); // Call immediately - if you delay then the event may be missed
 *```
 */
export class PendingTransaction {
  constructor(
    public readonly transactionId: string,
    public readonly message: string,
    public readonly error: boolean,
    private readonly waitDelegate: () => Promise<{
      txId: string;
      transactionHash: string;
      Data: Record<string, unknown>;
    }>,
  ) {}

  /**
   * Waits for the transaction to be confirmed.
   * This should be called immediately after receiving the PendingTransaction
   * to ensure proper event handling. If you delay calling this method and the
   * transaction confirms before you call this method, an error will be thrown.
   *
   * @returns A promise that resolves when the transaction is confirmed.
   */
  wait() {
    return this.waitDelegate();
  }
}
