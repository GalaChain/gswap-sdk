import { GSwapSDKError } from './gswap_sdk_error.js';

export class TransactionWaiter {
  private enabled = false;

  private readonly promiseInfoForTxId = new Map<
    string,
    {
      promise: Promise<{ txId: string; transactionHash: string; Data: Record<string, unknown> }>;
      resolve: (result: {
        txId: string;
        transactionHash: string;
        Data: Record<string, unknown>;
      }) => void;
      reject: (error: GSwapSDKError) => void;
      waited: boolean;
      timeoutId: number;
    }
  >();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      for (const [txId, promiseInfo] of this.promiseInfoForTxId.entries()) {
        clearTimeout(promiseInfo.timeoutId);
        promiseInfo.reject(
          GSwapSDKError.transactionWaitFailedError(txId, {
            message: 'Transaction waiter disabled',
          }),
        );
      }

      this.promiseInfoForTxId.clear();
    }
  }

  registerTxId(txId: string, timeoutMs: number): void {
    if (this.promiseInfoForTxId.has(txId)) {
      throw new GSwapSDKError(
        `Transaction ID is already registered`,
        'TRANSACTION_ID_ALREADY_REGISTERED',
        { txId },
      );
    }

    if (!this.enabled) {
      return;
    }

    let resolve: (args: {
      txId: string;
      transactionHash: string;
      Data: Record<string, unknown>;
    }) => void;
    let reject: () => void;

    const promise = new Promise<{
      txId: string;
      transactionHash: string;
      Data: Record<string, unknown>;
    }>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    // Automatically remove the promise after the timeout
    const timeoutId = setTimeout(() => {
      const promiseInfo = this.promiseInfoForTxId.get(txId);
      if (promiseInfo) {
        if (promiseInfo.waited) {
          promiseInfo.reject(GSwapSDKError.transactionWaitTimeoutError(txId));
        } else {
          promiseInfo.resolve({ txId, transactionHash: txId, Data: {} });
        }

        this.promiseInfoForTxId.delete(txId);
      }
    }, timeoutMs);

    this.promiseInfoForTxId.set(txId, {
      promise,
      resolve: resolve!,
      reject: reject!,
      timeoutId: timeoutId as unknown as number,
      waited: false,
    });
  }

  wait(txId: string) {
    const promise = this.promiseInfoForTxId.get(txId);
    if (!promise) {
      throw new GSwapSDKError(
        `Transaction ID is not registered for waiting`,
        'TRANSACTION_ID_NOT_REGISTERED',
        {
          txId,
        },
      );
    }

    promise.waited = true;
    return promise.promise;
  }

  notifySuccess(
    txId: string,
    data: { transactionId: string; Data: Record<string, unknown> },
  ): void {
    const promiseInfo = this.promiseInfoForTxId.get(txId);
    if (!promiseInfo) {
      return;
    }

    clearTimeout(promiseInfo.timeoutId);

    promiseInfo.resolve({
      txId,
      transactionHash: data.transactionId,
      Data: data.Data,
    });

    this.promiseInfoForTxId.delete(txId);
  }

  notifyFailure(txId: string, detail: Record<string, unknown>): void {
    const promiseInfo = this.promiseInfoForTxId.get(txId);
    if (!promiseInfo) {
      return;
    }

    clearTimeout(promiseInfo.timeoutId);

    if (promiseInfo.waited) {
      promiseInfo.reject(GSwapSDKError.transactionWaitFailedError(txId, detail));
    } else {
      promiseInfo.resolve({ txId, transactionHash: txId, Data: {} });
    }

    this.promiseInfoForTxId.delete(txId);
  }
}
