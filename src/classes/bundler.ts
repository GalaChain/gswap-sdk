import crypto from 'crypto';
import { TransactionPendingResponse } from '../types/api_responses.js';
import { debugLog } from '../utils/debug.js';
import { Events } from './events.js';
import { GSwapSDKError } from './gswap_sdk_error.js';
import { HttpClient } from './http_client.js';
import { PendingTransaction } from './pending_transaction.js';
import { GalaChainSigner } from './signers.js';

function randomUUID() {
  if (globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return crypto.randomUUID();
}

export class Bundler {
  constructor(
    private readonly bundlerBaseUrl: string,
    private readonly bundlingAPIBasePath: string,
    private readonly transactionWaitTimeoutMs: number,
    private readonly signer: GalaChainSigner | undefined,
    private readonly httpClient: HttpClient,
  ) {}

  async signObject<TInputType extends Record<string, unknown>>(
    methodName: string,
    toSign: TInputType,
  ): Promise<TInputType & { signature: string }> {
    if (!this.signer) {
      throw GSwapSDKError.noSignerError();
    }

    const withUniqueKey = {
      ...toSign,
      uniqueKey: toSign.uniqueKey ?? `galaswap - operation - ${randomUUID()}`,
    };

    debugLog('Signing object for method', methodName, withUniqueKey);

    return this.signer.signObject(methodName, withUniqueKey);
  }

  async sendBundlerRequest(
    method: string,
    body: Record<string, unknown>,
    stringsInstructions: string[],
  ): Promise<PendingTransaction> {
    if (!this.hasSigner()) {
      throw GSwapSDKError.noSignerError();
    }

    const requestBody = {
      method,
      signedDto: await this.signObject(method, body),
      stringsInstructions,
    };

    debugLog('Sending bundler request', method, requestBody);

    const response = await this.httpClient.sendPostRequest<TransactionPendingResponse>(
      this.bundlerBaseUrl,
      this.bundlingAPIBasePath,
      '',
      requestBody,
    );

    debugLog('Received bundler response', method, response);

    Events.instance.registerTxId(response.data, this.transactionWaitTimeoutMs);

    const transaction = new PendingTransaction(
      response.data,
      response.message,
      response.error,
      () => {
        return Events.instance.wait(response.data);
      },
    );

    return transaction;
  }

  hasSigner(): boolean {
    return this.signer !== undefined;
  }
}
