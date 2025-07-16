import { HTTPResponse } from '../types/http_requestor.js';
import { GalaChainTokenClassKey } from '../types/token.js';

export class GSwapSDKError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'GSwapSDKError';
  }

  public static noSignerError() {
    return new GSwapSDKError(
      'This method requires a signer. Please provide a signer to the GSwap constructor.',
      'NO_SIGNER',
    );
  }

  public static async fromErrorResponse(url: string, response: HTTPResponse) {
    const bodyText = await response.text();
    const bodyJson: unknown = (() => {
      try {
        return JSON.parse(bodyText);
      } catch {
        return undefined;
      }
    })();

    const errorKey =
      typeof bodyJson === 'object' &&
      bodyJson &&
      'error' in bodyJson &&
      typeof bodyJson.error === 'object' &&
      bodyJson.error &&
      'ErrorKey' in bodyJson.error &&
      typeof bodyJson.error.ErrorKey === 'string'
        ? bodyJson.error.ErrorKey
        : undefined;

    const message =
      typeof bodyJson === 'object' &&
      bodyJson &&
      'error' in bodyJson &&
      typeof bodyJson.error === 'object' &&
      bodyJson.error &&
      'Message' in bodyJson.error &&
      typeof bodyJson.error.Message === 'string'
        ? bodyJson.error.Message
        : undefined;

    if (errorKey && message) {
      return new GSwapSDKError(`GalaChain Error ${errorKey} from ${url}: ${message}`, errorKey, {
        message,
        errorKey,
        status: response.status,
        body: bodyJson,
        url,
      });
    }

    return new GSwapSDKError(`Unexpected HTTP Error ${response.status} from ${url}`, 'HTTP_ERROR', {
      status: response.status,
      body: bodyJson ?? bodyText,
      url,
    });
  }

  public static incorrectTokenOrderingError(
    specifiedToken0: GalaChainTokenClassKey | string,
    specifiedToken1: GalaChainTokenClassKey | string,
  ) {
    return new GSwapSDKError(
      'Token ordering is incorrect. token0 should sort below token1.',
      'INCORRECT_TOKEN_ORDERING',
      {
        specifiedToken0,
        specifiedToken1,
      },
    );
  }

  public static transactionWaitTimeoutError(txId: string) {
    return new GSwapSDKError('Transaction wait timed out.', 'TRANSACTION_WAIT_TIMEOUT', {
      txId,
    });
  }

  public static transactionWaitFailedError(txId: string, detail: Record<string, unknown>) {
    const transactionHash =
      'transactionId' in detail && typeof detail.transactionId === 'string'
        ? detail.transactionId
        : undefined;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { transactionId, ...rest } = detail;

    return new GSwapSDKError('Transaction wait failed.', 'TRANSACTION_WAIT_FAILED', {
      txId,
      transactionHash,
      ...rest,
    });
  }

  public static socketConnectionRequiredError() {
    return new GSwapSDKError(
      'This method requires a socket connection. Did you call connectSocket()?',
      'SOCKET_CONNECTION_REQUIRED',
    );
  }

  public static noPoolAvailableError(
    tokenIn: GalaChainTokenClassKey | string,
    tokenOut: GalaChainTokenClassKey | string,
    fee?: number,
  ) {
    const message =
      fee !== undefined
        ? `No pool available for the specified token pair at fee tier ${fee}`
        : 'No pools available for the specified token pair';

    return new GSwapSDKError(message, 'NO_POOL_AVAILABLE', {
      tokenIn,
      tokenOut,
      fee,
    });
  }
}
