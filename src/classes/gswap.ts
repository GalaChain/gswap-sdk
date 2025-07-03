import { HttpRequestor } from '../types/http_requestor.js';
import { Assets } from './assets.js';
import { Bundler } from './bundler.js';
import { Events } from './events.js';
import { HttpClient } from './http_client.js';
import { Pools } from './pools.js';
import { Positions } from './positions.js';
import { Quoting } from './quoting.js';
import { GalaChainSigner } from './signers.js';
import { Swaps } from './swaps.js';

/**
 * Main class for interacting with the gSwap decentralized exchange.
 * Provides methods for trading, liquidity management, and position handling.
 */
export class GSwap {
  public readonly gatewayBaseUrl: string;
  public readonly dexContractBasePath: string;
  public readonly tokenContractBasePath: string;
  public readonly bundlerBaseUrl: string;
  public readonly bundlingAPIBasePath: string;
  public readonly dexBackendBaseUrl: string;
  public readonly transactionWaitTimeoutMs: number;
  public readonly signer?: GalaChainSigner | undefined;

  /**
   * Quoting functionality for price discovery and trade estimation.
   * Use this to get quotes for token swaps without executing transactions.
   *
   * @example
   * ```typescript
   * // Get the best quote across all fee tiers
   * const quote = await gSwap.quoting.quoteExactInput(tokenA, tokenB, amount);
   * ```
   */
  public readonly quoting: Quoting;

  /**
   * Position management operations for liquidity positions.
   * Use this to manage liquidity positions including creation, modification, and fee collection.
   *
   * @example
   * ```typescript
   * // Get all user positions
   * const positions = await gSwap.positions.getUserPositions('eth|123...abc');
   *
   * // Add liquidity to a position using price range
   * const result = await gSwap.positions.addLiquidityByPrice({
   *   walletAddress: 'eth|123...abc',
   *   positionId: '',
   *   token0: 'GALA|Unit|none|none',
   *   token1: 'GUSDC|Unit|none|none',
   *   fee: 500,
   *   tickSpacing: 10,
   *   minPrice: '0.45',
   *   maxPrice: '0.55',
   *   amount0Desired: '100',
   *   amount1Desired: '50',
   *   amount0Min: '95',
   *   amount1Min: '47.5'
   * });
   * ```
   */
  public readonly positions: Positions;

  /**
   * Token swap operations for trading tokens.
   * Use this to execute token swaps on the DEX.
   *
   * @example
   * ```typescript
   * // Execute an exact input swap: sell 100 GALA for USDC
   * const result = await gSwap.swaps.swap(
   *   'GALA|Unit|none|none',
   *   'GUSDC|Unit|none|none',
   *   500,
   *   { exactIn: '100', amountOutMinimum: '45' },
   *   'eth|123...abc', // your wallet address
   * );
   * ```
   */
  public readonly swaps: Swaps;

  /**
   * User asset management operations.
   * Use this to retrieve user token balances and asset information.
   *
   * @example
   * ```typescript
   * // Get user assets with pagination
   * const assets = await gSwap.assets.getUserAssets('eth|123...abc', 1, 20);
   * console.log(`User has ${assets.count} different tokens`);
   * ```
   */
  public readonly assets: Assets;

  /**
   * Event management operations for real-time socket connections.
   * Use this to manage event streaming and transaction status updates.
   *
   * @example
   * ```typescript
   * // Connect to event socket for transaction updates
   * await GSwap.events.connectEventSocket();
   *
   * // Check if socket is connected
   * const isConnected = GSwap.events.eventSocketConnected();
   * ```
   */
  public static readonly events = Events.instance;

  private readonly httpClient: HttpClient;
  private readonly httpRequestor: HttpRequestor;
  private readonly bundler: Bundler;
  public readonly pools: Pools;

  /**
   * Creates a new SDK instance.
   * @param options - Customization options.
   * @param options.signer - The signer to use for authenticated operations. Required if you use any functionality that creates transactions (such as swapping). Not required for readonly operations.
   * @param options.gatewayBaseUrl - Base URL for the GalaChain Gateway API.
   * @param options.dexContractBasePath - Base path for DEX contract API endpoints, within the GalaChain Gateway API.
   * @param options.tokenContractBasePath - Base path for token contract API endpoints, within the GalaChain Gateway API.
   * @param options.bundlerBaseUrl - Base URL for the DEX transaction bundling API.
   * @param options.bundlingAPIBasePath - Base path for transaction bundling API endpoints.
   * @param options.dexBackendBaseUrl - Base URL for the DEX backend API (for user assets and other data).
   * @param options.httpRequestor - Custom HTTP requestor to use for API calls. Defaults to the global `fetch` function.
   * @param options.transactionWaitTimeoutMs - Timeout in milliseconds for waiting for transactions to complete. Defaults to 300,000 milliseconds (five minutes).
   * @param options.walletAddress - Optional default wallet address for operations that require a wallet address (e.x. swapping). If not provided, you must specify the wallet address in each method call.
   */
  constructor(options?: {
    signer?: GalaChainSigner | undefined;
    gatewayBaseUrl?: string | undefined;
    dexContractBasePath?: string | undefined;
    tokenContractBasePath?: string | undefined;
    bundlerBaseUrl?: string | undefined;
    bundlingAPIBasePath?: string | undefined;
    dexBackendBaseUrl?: string | undefined;
    transactionWaitTimeoutMs?: number | undefined;
    walletAddress?: string | undefined;
    httpRequestor?: HttpRequestor | undefined;
  }) {
    this.gatewayBaseUrl =
      options?.gatewayBaseUrl?.replace(/\/$/, '') ??
      'https://galachain-gateway-chain-platform-stage-chain-platform-eks.stage.galachain.com'; // 'https://gateway-mainnet.galachain.com'; // TODO
    this.dexContractBasePath = options?.dexContractBasePath ?? '/api/asset/dexv3-contract';
    this.tokenContractBasePath = options?.tokenContractBasePath ?? '/api/asset/token-contract';
    this.bundlerBaseUrl = options?.bundlerBaseUrl ?? 'https://bundle-backend-test1.defi.gala.com'; // TODO
    this.bundlingAPIBasePath = options?.bundlingAPIBasePath ?? '/bundle';
    this.dexBackendBaseUrl = options?.dexBackendBaseUrl ?? 'https://dex-backend-dev1.defi.gala.com'; // TODO
    this.signer = options?.signer;
    this.transactionWaitTimeoutMs = options?.transactionWaitTimeoutMs ?? 300_000; // 5 minutes
    this.httpRequestor = options?.httpRequestor ?? fetch.bind(globalThis);

    this.httpClient = new HttpClient(this.httpRequestor);

    this.bundler = new Bundler(
      this.bundlerBaseUrl,
      this.bundlingAPIBasePath,
      this.transactionWaitTimeoutMs,
      this.signer,
      this.httpClient,
    );

    this.pools = new Pools(this.gatewayBaseUrl, this.dexContractBasePath, this.httpClient);

    this.quoting = new Quoting(this.gatewayBaseUrl, this.dexContractBasePath, this.httpClient);

    this.positions = new Positions(
      this.gatewayBaseUrl,
      this.dexContractBasePath,
      this.bundler,
      this.pools,
      this.httpClient,
      { walletAddress: options?.walletAddress },
    );

    this.swaps = new Swaps(this.bundler, { walletAddress: options?.walletAddress });

    this.assets = new Assets(this.dexBackendBaseUrl, this.httpClient);
  }
}
