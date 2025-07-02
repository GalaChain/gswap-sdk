import { HttpRequestor } from '../types/http_requestor.js';
import { debugLog } from '../utils/debug.js';
import { GSwapSDKError } from './gswap_sdk_error.js';

export class HttpClient {
  constructor(private readonly httpRequestor: HttpRequestor = fetch) {}

  private async sendRequest<TReturnType>(
    method: 'POST' | 'GET',
    baseUrl: string,
    basePath: string,
    endpoint: string,
    body?: unknown,
  ): Promise<TReturnType> {
    const url = `${baseUrl}${basePath}${endpoint}`;
    debugLog(`Sending request to ${url} with body:`, body);

    const response = await this.httpRequestor(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GalaChain-SDK/0.0',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      throw await GSwapSDKError.fromErrorResponse(url, response);
    }

    const json = await response.json();
    debugLog(`Response from ${baseUrl}${basePath}${endpoint}:`, json);

    return json as TReturnType;
  }

  async sendPostRequest<TReturnType>(
    baseUrl: string,
    basePath: string,
    endpoint: string,
    body: unknown,
  ): Promise<TReturnType> {
    return this.sendRequest('POST', baseUrl, basePath, endpoint, body);
  }

  async sendGetRequest<TReturnType>(
    baseUrl: string,
    basePath: string,
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<TReturnType> {
    const searchParams = params ? new URLSearchParams(params) : undefined;
    const endpointWithParams = searchParams ? `${endpoint}?${searchParams.toString()}` : endpoint;

    return this.sendRequest('GET', baseUrl, basePath, endpointWithParams, undefined);
  }
}
