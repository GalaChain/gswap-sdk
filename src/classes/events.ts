import { debugLog } from '../utils/debug.js';
import { BundlerResponse, EventSocketClient, TradeEventEmitter } from './event_socket_client.js';
import { GSwapSDKError } from './gswap_sdk_error.js';
import { TransactionWaiter } from './tx_waiter.js';

/**
 * Service for handling real-time event streaming and socket connections.
 * Manages the global socket connection for transaction status updates.
 */
export class Events {
  private globalSocketClient?: TradeEventEmitter | undefined;
  private globalWaitHelper = new TransactionWaiter();
  private connectionPromise?: Promise<TradeEventEmitter> | undefined;

  public static readonly instance = new Events();
  public static tradeEventEmitterConstructor: new (url: string) => TradeEventEmitter =
    EventSocketClient;

  /**
   * Establishes a global socket connection for real-time event streaming.
   * This connection is shared across all service instances.
   * @param bundlerBaseUrl - Optional bundler base URL. If not provided, uses default.
   * @returns The connected EventSocketClient.
   * @example
   * ```typescript
   * await eventsService.connectEventSocket();
   *
   * // Socket is now available for transaction updates
   * ```
   */
  async connectEventSocket(bundlerBaseUrl?: string): Promise<TradeEventEmitter> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.globalSocketClient?.isConnected()) {
      return this.globalSocketClient;
    }

    const url = bundlerBaseUrl ?? 'https://bundle-backend-prod1.defi.gala.com';
    this.connectionPromise = (async () => {
      const client = new Events.tradeEventEmitterConstructor(url);
      await client.connect();

      if (!this.globalWaitHelper) {
        this.globalWaitHelper = new TransactionWaiter();
      }

      client.on('transaction', this.internalHandleSocketMessage.bind(this));

      return client;
    })();

    this.globalSocketClient = await this.connectionPromise;
    this.connectionPromise = undefined;
    this.globalWaitHelper.setEnabled(true);

    return this.globalSocketClient;
  }

  /**
   * Disconnects the global socket connection and cleans up resources.
   */
  disconnectEventSocket(): void {
    if (this.globalSocketClient) {
      this.globalSocketClient.off('transaction', this.internalHandleSocketMessage.bind(this));
      this.globalSocketClient.disconnect();
      this.globalSocketClient = undefined;
      this.globalWaitHelper.setEnabled(false);
    }
  }

  /**
   * Checks if the global socket connection is active.
   * @returns True if connected, false otherwise.
   */
  eventSocketConnected(): boolean {
    return this.globalSocketClient?.isConnected() ?? false;
  }

  /**
   * Registers a transaction ID for waiting and timeout handling.
   * @param txId - The transaction ID to register.
   * @param timeoutMs - Timeout in milliseconds.
   */
  registerTxId(txId: string, timeoutMs: number): void {
    this.globalWaitHelper.registerTxId(txId, timeoutMs);
  }

  /**
   * Waits for a transaction to complete.
   * @param txId - The transaction ID to wait for.
   * @returns Promise that resolves when the transaction completes.
   */
  async wait(
    txId: string,
  ): Promise<{ txId: string; transactionHash: string; Data: Record<string, unknown> }> {
    if (!this.eventSocketConnected()) {
      throw GSwapSDKError.socketConnectionRequiredError();
    }
    return this.globalWaitHelper.wait(txId);
  }

  /**
   * Internal handler for socket messages.
   * @param response - The bundler response.
   * @param txId - The transaction ID.
   */
  private internalHandleSocketMessage(txId: string, response: BundlerResponse): void {
    if (response.status === 'PROCESSED') {
      this.globalWaitHelper.notifySuccess(txId, response.data);
    } else if (response.status === 'FAILED') {
      this.globalWaitHelper.notifyFailure(txId, response.data);
    } else {
      // @ts-expect-error - Property 'status' does not exist on type 'never'.ts(2339)
      debugLog(`Unknown response status for transaction ${txId}:`, response.status);
    }
  }
}
