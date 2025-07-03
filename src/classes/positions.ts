import BigNumber from 'bignumber.js';
import { NumericAmount, PriceIn } from '../types/amounts.js';
import { FEE_TIER } from '../types/fees.js';
import type { GetPositionResult, GetUserPositionsResult } from '../types/sdk_results.js';
import type { GalaChainTokenClassKey } from '../types/token.js';
import { parseTokenClassKey, stringifyTokenClassKey } from '../utils/token.js';
import { getTokenOrdering } from '../utils/token_ordering.js';
import {
  validateFee,
  validateNumericAmount,
  validatePriceValues,
  validateTickRange,
  validateTickSpacing,
  validateTokenDecimals,
  validateWalletAddress,
} from '../utils/validation.js';
import { Bundler } from './bundler.js';
import { HttpClient } from './http_client.js';
import { Pools } from './pools.js';

/**
 * Handles position management operations for liquidity positions.
 */
export class Positions {
  private readonly httpClient: HttpClient;
  private readonly bundlerService: Bundler;
  private readonly poolService: Pools;

  constructor(
    private readonly gatewayBaseUrl: string,
    private readonly dexContractBasePath: string,
    bundlerService: Bundler,
    poolService: Pools,
    httpClient: HttpClient,
    private readonly options?: {
      walletAddress?: string | undefined; // Optional default wallet address for operations
    },
  ) {
    this.httpClient = httpClient;
    this.bundlerService = bundlerService;
    this.poolService = poolService;
  }

  /**
   * Get all liquidity positions for a specific wallet address.
   * @param ownerAddress - The wallet address to get positions for.
   * @param limit - Maximum number of positions to return.
   * @param bookmark - Pagination bookmark for retrieving additional results. If you call this function and it returns a bookmark that is not an empty string, you can pass that bookmark as this parameter in a subsequent call to fetch the next page.
   * @returns User positions and pagination bookmark
   * @example
   * ```typescript
   * const positions = await gSwap.positions.getUserPositions('eth|123...abc');
   * console.log(positions);
   * ```
   */
  async getUserPositions(ownerAddress: string, limit?: number, bookmark?: string) {
    const results = await this.sendUserPositionsRequest('/GetUserPositions', {
      user: ownerAddress,
      limit,
      bookmark,
    });

    return {
      bookmark: results.nextBookMark,
      positions: results.positions,
    };
  }

  /**
   * Gets detailed information about a specific liquidity position.
   * @param ownerAddress - The wallet address that owns the position.
   * @param position - Position parameters including tokens, fee, and tick range.
   * @param position.token0ClassKey - The first token in the position.
   * @param position.token1ClassKey - The second token in the position.
   * @param position.fee - The pool fee tier.
   * @param position.tickLower - The lower tick of the position range.
   * @param position.tickUpper - The upper tick of the position range.
   * @returns Detailed position information.
   * @example
   * ```typescript
   * const position = await gSwap.positions.getPosition('eth|123...abc', {
   *   token0ClassKey: 'GALA|Unit|none|none',
   *   token1ClassKey: 'GUSDC|Unit|none|none',
   *   fee: 500,
   *   tickLower: -6000,
   *   tickUpper: 6000
   * });
   * console.log('Position:', position);
   * ```
   */
  async getPosition(
    ownerAddress: string,
    position: {
      token0ClassKey: GalaChainTokenClassKey | string;
      token1ClassKey: GalaChainTokenClassKey | string;
      fee: number;
      tickLower: number;
      tickUpper: number;
    },
  ) {
    const result = await this.sendPositionRequest('/GetPositions', {
      owner: ownerAddress,
      token0: parseTokenClassKey(position.token0ClassKey),
      token1: parseTokenClassKey(position.token1ClassKey),
      fee: position.fee,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
    });

    return result;
  }

  /**
   * Gets detailed information about a liquidity position by its ID.
   * @param ownerAddress - The wallet address that owns the position.
   * @param positionId - The unique identifier of the position.
   * @returns Detailed position information, or undefined if not found.
   * @example
   * ```typescript
   * const position = await gSwap.positions.getPositionById('eth|123...abc', 'position-uuid-123');
   * if (position) {
   *   console.log('Position found:', position);
   * } else {
   *   console.log('Position not found');
   * }
   * ```
   */
  async getPositionById(ownerAddress: string, positionId: string) {
    const userPositions = await this.getUserPositions(ownerAddress);
    const position = userPositions.positions.find((pos) => pos.positionId === positionId);
    if (!position) {
      return undefined;
    }

    return this.getPosition(ownerAddress, position);
  }

  /**
   * Creates a new position or adds liquidity to a position, using a specific tick range. Consider using `addLiquidityByPrice()` instead unless you want to use ticks directly.
   * @param args - Parameters for adding liquidity.
   * @param args.walletAddress - The wallet address adding liquidity.
   * @param args.positionId - The position identifier. If you're creating a new position, this should be an empty string.
   * @param args.token0 - The first token in the pair.
   * @param args.token1 - The second token in the pair.
   * @param args.fee - The pool fee tier.
   * @param args.tickLower - The lower tick of the position range.
   * @param args.tickUpper - The upper tick of the position range.
   * @param args.amount0Desired - Desired (also maximum) amount of token0 to add.
   * @param args.amount1Desired - Desired (also maximum) amount of token1 to add.
   * @param args.amount0Min - Minimum amount of token0 to add (slippage protection).
   * @param args.amount1Min - Minimum amount of token1 to add (slippage protection).
   * @returns Pending transaction.
   * @example
   * ```typescript
   * const result = await gSwap.positions.addLiquidityByTicks({
   *   walletAddress: 'eth|123...abc',
   *   positionId: '',
   *   token0: 'GALA|Unit|none|none',
   *   token1: 'GUSDC|Unit|none|none',
   *   fee: 500,
   *   tickSpacing: 10,
   *   tickLower: -6000,
   *   tickUpper: 6000,
   *   amount0Desired: '100',
   *   amount1Desired: '50',
   *   amount0Min: '95',
   *   amount1Min: '47.5'
   * });
   * console.log('Liquidity added:', result);
   * ```
   */
  async addLiquidityByTicks(args: {
    walletAddress?: string;
    positionId: string;
    token0: GalaChainTokenClassKey | string;
    token1: GalaChainTokenClassKey | string;
    fee: FEE_TIER;
    tickLower: number;
    tickUpper: number;
    amount0Desired: NumericAmount;
    amount1Desired: NumericAmount;
    amount0Min: NumericAmount;
    amount1Min: NumericAmount;
  }) {
    const walletAddress = args.walletAddress ?? this.options?.walletAddress;

    validateWalletAddress(walletAddress);
    validateFee(args.fee);
    validateTickRange(args.tickLower, args.tickUpper);
    validateNumericAmount(args.amount0Desired, 'amount0Desired');
    validateNumericAmount(args.amount1Desired, 'amount1Desired');
    validateNumericAmount(args.amount0Min, 'amount0Min', true);
    validateNumericAmount(args.amount1Min, 'amount1Min', true);

    const token0TokenClassKey = parseTokenClassKey(args.token0);
    const token1TokenClassKey = parseTokenClassKey(args.token1);

    const ordering = getTokenOrdering(
      token0TokenClassKey,
      token1TokenClassKey,
      true,
      [args.amount0Desired, args.amount0Min],
      [args.amount1Desired, args.amount1Min],
    );

    const toSign = {
      token0: ordering.token0,
      token1: ordering.token1,
      fee: args.fee,
      owner: args.walletAddress,
      tickLower: args.tickLower,
      tickUpper: args.tickUpper,
      amount0Desired: ordering?.token0Attributes?.[0]?.toString(),
      amount1Desired: ordering?.token1Attributes?.[0]?.toString(),
      amount0Min: ordering?.token0Attributes?.[1]?.toString(),
      amount1Min: ordering?.token1Attributes?.[1]?.toString(),
      positionId: args.positionId,
    };

    const token0StringKey = stringifyTokenClassKey(ordering.token0, '$');
    const token1StringKey = stringifyTokenClassKey(ordering.token1, '$');

    const poolString = `$pool$${token0StringKey}$${token1StringKey}$${args.fee}`;
    const userPositionString = `$userPosition$${args.walletAddress}`;
    const tokenBalance0 = `$tokenBalance$${token0StringKey}$${args.walletAddress}`;
    const tokenBalance1 = `$tokenBalance$${token1StringKey}$${args.walletAddress}`;
    const tokenBalance0Pool = `$tokenBalance$${token0StringKey}$${poolString}`;
    const tokenBalance1Pool = `$tokenBalance$${token1StringKey}$${poolString}`;

    const stringsInstructions = [
      poolString,
      userPositionString,
      tokenBalance0,
      tokenBalance1,
      tokenBalance0Pool,
      tokenBalance1Pool,
    ];

    return this.bundlerService.sendBundlerRequest('AddLiquidity', toSign, stringsInstructions);
  }

  /**
   * Creates a new position or adds liquidity to a position, using a specified price range. Note that this method automatically converts your minPrice and maxPrice to ticks, rounding down if necessary.
   * @param args - Parameters for adding liquidity.
   * @param args.walletAddress - The wallet address adding liquidity.
   * @param args.positionId - The position identifier. This should be an empty string if you are creating a new position.
   * @param args.token0 - The first token in the pair.
   * @param args.token1 - The second token in the pair.
   * @param args.fee - The pool fee tier.
   * @param args.tickSpacing - The tick spacing for the pool.
   * @param args.minPrice - The minimum price for the position range.
   * @param args.maxPrice - The maximum price for the position range.
   * @param args.amount0Desired - Desired (also maximum) amount of token0 to add.
   * @param args.amount1Desired - Desired (also maximum) amount of token1 to add.
   * @param args.amount0Min - Minimum amount of token0 to add (slippage protection).
   * @param args.amount1Min - Minimum amount of token1 to add (slippage protection).
   * @returns Pending transaction.
   * @example
   * ```typescript
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
   * console.log('Liquidity added with price range:', result);
   * ```
   */
  async addLiquidityByPrice(args: {
    walletAddress?: string;
    positionId: string;
    token0: GalaChainTokenClassKey | string;
    token1: GalaChainTokenClassKey | string;
    fee: number;
    tickSpacing: number;
    minPrice: PriceIn;
    maxPrice: PriceIn;
    amount0Desired: NumericAmount;
    amount1Desired: NumericAmount;
    amount0Min: NumericAmount;
    amount1Min: NumericAmount;
  }) {
    const walletAddress = args.walletAddress ?? this.options?.walletAddress;

    validateWalletAddress(walletAddress);
    validateFee(args.fee);
    validateTickSpacing(args.tickSpacing);
    validateNumericAmount(args.minPrice, 'minPrice', true);
    validateNumericAmount(args.maxPrice, 'maxPrice');
    validateNumericAmount(args.amount0Desired, 'amount0Desired');
    validateNumericAmount(args.amount1Desired, 'amount1Desired');
    validateNumericAmount(args.amount0Min, 'amount0Min', true);
    validateNumericAmount(args.amount1Min, 'amount1Min', true);

    if (BigNumber(args.minPrice).isGreaterThan(BigNumber(args.maxPrice))) {
      throw new Error('Invalid price range: minPrice must be less than or equal to maxPrice');
    }

    const token0TokenClassKey = parseTokenClassKey(args.token0);
    const token1TokenClassKey = parseTokenClassKey(args.token1);

    const ordering = getTokenOrdering(
      token0TokenClassKey,
      token1TokenClassKey,
      true,
      [args.amount0Desired, args.amount0Min],
      [args.amount1Desired, args.amount1Min],
    );

    const minPriceTicks = this.poolService.calculateTicksForPrice(args.minPrice, args.tickSpacing);
    const maxPriceTicks = this.poolService.calculateTicksForPrice(args.maxPrice, args.tickSpacing);

    const tickLower = ordering.zeroForOne ? minPriceTicks : maxPriceTicks * -1;
    const tickUpper = ordering.zeroForOne ? maxPriceTicks : minPriceTicks * -1;

    const toSign = {
      token0: ordering.token0,
      token1: ordering.token1,
      fee: args.fee,
      owner: args.walletAddress,
      tickLower,
      tickUpper,
      amount0Desired: ordering?.token0Attributes?.[0],
      amount1Desired: ordering?.token1Attributes?.[0],
      amount0Min: ordering?.token0Attributes?.[1],
      amount1Min: ordering?.token1Attributes?.[1],
      positionId: args.positionId,
    };

    const token0StringKey = stringifyTokenClassKey(ordering.token0, '$');
    const token1StringKey = stringifyTokenClassKey(ordering.token1, '$');

    const poolString = `$pool$${token0StringKey}$${token1StringKey}$${args.fee}`;
    const userPositionString = `$userPosition$${args.walletAddress}`;
    const tokenBalance0 = `$tokenBalance$${token0StringKey}$${args.walletAddress}`;
    const tokenBalance1 = `$tokenBalance$${token1StringKey}$${args.walletAddress}`;
    const tokenBalance0Pool = `$tokenBalance$${token0StringKey}$${poolString}`;
    const tokenBalance1Pool = `$tokenBalance$${token1StringKey}$${poolString}`;

    const stringsInstructions = [
      poolString,
      userPositionString,
      tokenBalance0,
      tokenBalance1,
      tokenBalance0Pool,
      tokenBalance1Pool,
    ];

    return this.bundlerService.sendBundlerRequest('AddLiquidity', toSign, stringsInstructions);
  }

  /**
   * Removes liquidity from a position.
   * @param args - Parameters for removing liquidity.
   * @param args.walletAddress - The wallet address removing liquidity.
   * @param args.positionId - The position identifier.
   * @param args.token0 - The first token in the pair.
   * @param args.token1 - The second token in the pair.
   * @param args.fee - The pool fee tier.
   * @param args.tickLower - The lower tick of the position range.
   * @param args.tickUpper - The upper tick of the position range.
   * @param args.amount - The amount of liquidity to remove.
   * @param args.amount0Min - Minimum amount of token0 to receive (slippage protection, optional).
   * @param args.amount1Min - Minimum amount of token1 to receive (slippage protection, optional).
   * @returns Pending transaction.
   * @example
   * ```typescript
   * // Remove 50% of liquidity from a position
   * const result = await gSwap.positions.removeLiquidity({
   *   walletAddress: 'eth|123...abc',
   *   positionId: 'position-123',
   *   token0: 'GALA|Unit|none|none',
   *   token1: 'GUSDC|Unit|none|none',
   *   fee: 500,
   *   tickLower: -6000,
   *   tickUpper: 6000,
   *   amount: '50000000000000000000', // 50% of position liquidity
   *   amount0Min: '45',
   *   amount1Min: '22'
   * });
   * console.log('Liquidity removed:', result);
   * ```
   */
  async removeLiquidity(args: {
    walletAddress?: string;
    positionId: string;
    token0: GalaChainTokenClassKey | string;
    token1: GalaChainTokenClassKey | string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    amount: NumericAmount;
    amount0Min?: NumericAmount;
    amount1Min?: NumericAmount;
  }) {
    const walletAddress = args.walletAddress ?? this.options?.walletAddress;

    validateWalletAddress(walletAddress);
    validateFee(args.fee);
    validateTickRange(args.tickLower, args.tickUpper);
    validateNumericAmount(args.amount, 'amount');

    if (args.amount0Min !== undefined) {
      validateNumericAmount(args.amount0Min, 'amount0Min', true);
    }
    if (args.amount1Min !== undefined) {
      validateNumericAmount(args.amount1Min, 'amount1Min', true);
    }

    const token0TokenClassKey = parseTokenClassKey(args.token0);
    const token1TokenClassKey = parseTokenClassKey(args.token1);

    const ordering = getTokenOrdering(
      token0TokenClassKey,
      token1TokenClassKey,
      true,
      [args.amount0Min ?? 0],
      [args.amount1Min ?? 0],
    );

    const toSign = {
      token0: ordering.token0,
      token1: ordering.token1,
      fee: args.fee,
      tickLower: args.tickLower,
      tickUpper: args.tickUpper,
      amount: args.amount.toString(),
      amount0Min: ordering?.token0Attributes?.[0] || '0',
      amount1Min: ordering?.token1Attributes?.[0] || '0',
      positionId: args.positionId,
    };

    const token0StringKey = stringifyTokenClassKey(ordering.token0, '$');
    const token1StringKey = stringifyTokenClassKey(ordering.token1, '$');

    const poolString = `$pool$${token0StringKey}$${token1StringKey}$${args.fee}`;
    const userPositionString = `$userPosition$${args.walletAddress}`;
    const tokenBalance0 = `$tokenBalance$${token0StringKey}$${args.walletAddress}`;
    const tokenBalance1 = `$tokenBalance$${token1StringKey}$${args.walletAddress}`;
    const tokenBalance0Pool = `$tokenBalance$${token0StringKey}$${poolString}`;
    const tokenBalance1Pool = `$tokenBalance$${token1StringKey}$${poolString}`;

    const stringsInstructions = [
      poolString,
      userPositionString,
      tokenBalance0,
      tokenBalance1,
      tokenBalance0Pool,
      tokenBalance1Pool,
    ];

    return this.bundlerService.sendBundlerRequest('RemoveLiquidity', toSign, stringsInstructions);
  }

  /**
   * Collects accumulated fees from a liquidity position.
   * @param args - Parameters for collecting fees.
   * @param args.walletAddress - The wallet address collecting fees.
   * @param args.positionId - The position identifier.
   * @param args.token0 - The first token in the pair.
   * @param args.token1 - The second token in the pair.
   * @param args.fee - The pool fee tier.
   * @param args.tickLower - The lower tick of the position range.
   * @param args.tickUpper - The upper tick of the position range.
   * @param args.amount0Requested - Desired amount of token0 fees to collect.
   * @param args.amount1Requested - Desired amount of token1 fees to collect.
   * @returns Pending transaction.
   * @example
   * ```typescript
   * // Collect all accumulated fees from a position
   * const result = await gSwap.positions.collectPositionFees({
   *   walletAddress: 'eth|123...abc',
   *   positionId: 'position-123',
   *   token0: 'GALA|Unit|none|none',
   *   token1: 'GUSDC|Unit|none|none',
   *   fee: 500,
   *   tickLower: -6000,
   *   tickUpper: 6000,
   *   amount0Requested: '1000000000000000000', // Max fees available
   *   amount1Requested: '500000000' // Max fees available
   * });
   * console.log('Fees collected:', result);
   * ```
   */
  async collectPositionFees(args: {
    walletAddress?: string;
    positionId: string;
    token0: GalaChainTokenClassKey | string;
    token1: GalaChainTokenClassKey | string;
    fee: number;
    tickLower: number;
    tickUpper: number;
    amount0Requested: NumericAmount;
    amount1Requested: NumericAmount;
  }) {
    const walletAddress = args.walletAddress ?? this.options?.walletAddress;

    validateWalletAddress(walletAddress);
    validateFee(args.fee);
    validateTickRange(args.tickLower, args.tickUpper);
    validateNumericAmount(args.amount0Requested, 'amount0Requested', true);
    validateNumericAmount(args.amount1Requested, 'amount1Requested', true);

    const token0TokenClassKey = parseTokenClassKey(args.token0);
    const token1TokenClassKey = parseTokenClassKey(args.token1);

    const ordering = getTokenOrdering(
      token0TokenClassKey,
      token1TokenClassKey,
      true,
      [args.amount0Requested],
      [args.amount1Requested],
    );

    const toSign = {
      token0: ordering.token0,
      token1: ordering.token1,
      fee: args.fee,
      amount0Requested: ordering?.token0Attributes?.[0],
      amount1Requested: ordering?.token1Attributes?.[0],
      tickLower: args.tickLower,
      tickUpper: args.tickUpper,
      positionId: args.positionId,
    };

    const token0StringKey = stringifyTokenClassKey(ordering.token0, '$');
    const token1StringKey = stringifyTokenClassKey(ordering.token1, '$');

    const poolString = `$pool$${token0StringKey}$${token1StringKey}$${args.fee}`;
    const userPositionString = `$userPosition$${args.walletAddress}`;
    const tokenBalance0 = `$tokenBalance$${token0StringKey}$${args.walletAddress}`;
    const tokenBalance1 = `$tokenBalance$${token1StringKey}$${args.walletAddress}`;
    const tokenBalance0Pool = `$tokenBalance$${token0StringKey}$${poolString}`;
    const tokenBalance1Pool = `$tokenBalance$${token1StringKey}$${poolString}`;

    const stringsInstructions = [
      poolString,
      userPositionString,
      tokenBalance0,
      tokenBalance1,
      tokenBalance0Pool,
      tokenBalance1Pool,
    ];

    return this.bundlerService.sendBundlerRequest(
      'CollectPositionFees',
      toSign,
      stringsInstructions,
    );
  }

  public calculateOptimalPositionSize(
    tokenAmount: NumericAmount,
    spotPrice: NumericAmount,
    lowerPrice: NumericAmount,
    upperPrice: NumericAmount,
    tokenDecimals: number,
    otherTokenDecimals: number,
  ) {
    validateNumericAmount(tokenAmount, 'tokenAmount');
    validatePriceValues(spotPrice, lowerPrice, upperPrice);
    validateTokenDecimals(tokenDecimals, 'tokenDecimals');
    validateTokenDecimals(otherTokenDecimals, 'otherTokenDecimals');

    const bnTokenAmount = BigNumber(tokenAmount);
    const bnSpotPrice = BigNumber(spotPrice);
    const bnLowerPrice = BigNumber(lowerPrice);
    let bnUpperPrice = BigNumber(upperPrice);

    bnUpperPrice = bnUpperPrice.isFinite() ? bnUpperPrice : BigNumber(1e18);

    const liquidityAmount = bnTokenAmount
      .times(10 ** (tokenDecimals - otherTokenDecimals))
      .times(bnSpotPrice.sqrt())
      .times(bnUpperPrice.sqrt())
      .div(bnUpperPrice.sqrt().minus(bnSpotPrice.sqrt()));

    const yAmount = BigNumber(liquidityAmount).times(bnSpotPrice.sqrt().minus(bnLowerPrice.sqrt()));
    const untruncated = yAmount.div(BigNumber(10).pow(tokenDecimals - otherTokenDecimals));

    return BigNumber(untruncated.toFixed(otherTokenDecimals, BigNumber.ROUND_DOWN));
  }

  private async sendUserPositionsRequest(
    endpoint: string,
    body: unknown,
  ): Promise<{
    nextBookMark: string;
    positions: GetUserPositionsResult[];
  }> {
    const responseBody = await this.httpClient.sendPostRequest<{
      Status: number;
      Data: {
        nextBookMark: string;
        positions: Array<{
          poolHash: string;
          positionId: string;
          token0ClassKey: {
            additionalKey: string;
            category: string;
            collection: string;
            type: string;
          };
          token1ClassKey: {
            additionalKey: string;
            category: string;
            collection: string;
            type: string;
          };
          token0Img: string;
          token1Img: string;
          token0Symbol: string;
          token1Symbol: string;
          fee: number;
          liquidity: string;
          tickLower: number;
          tickUpper: number;
          createdAt: string;
        }>;
      };
    }>(this.gatewayBaseUrl, this.dexContractBasePath, endpoint, body);

    // Convert string fields to BigNumber
    return {
      nextBookMark: responseBody.Data.nextBookMark,
      positions: responseBody.Data.positions.map((position) => ({
        ...position,
        liquidity: BigNumber(position.liquidity),
      })),
    };
  }

  private async sendPositionRequest(endpoint: string, body: unknown): Promise<GetPositionResult> {
    const responseBody = await this.httpClient.sendPostRequest<{
      Status: number;
      Data: {
        fee: number;
        feeGrowthInside0Last: string;
        feeGrowthInside1Last: string;
        liquidity: string;
        poolHash: string;
        positionId: string;
        tickLower: number;
        tickUpper: number;
        token0ClassKey: {
          additionalKey: string;
          category: string;
          collection: string;
          type: string;
        };
        token1ClassKey: {
          additionalKey: string;
          category: string;
          collection: string;
          type: string;
        };
        tokensOwed0: string;
        tokensOwed1: string;
      };
    }>(this.gatewayBaseUrl, this.dexContractBasePath, endpoint, body);

    // Convert string fields to BigNumber
    return {
      ...responseBody.Data,
      feeGrowthInside0Last: BigNumber(responseBody.Data.feeGrowthInside0Last),
      feeGrowthInside1Last: BigNumber(responseBody.Data.feeGrowthInside1Last),
      liquidity: BigNumber(responseBody.Data.liquidity),
      tokensOwed0: BigNumber(responseBody.Data.tokensOwed0),
      tokensOwed1: BigNumber(responseBody.Data.tokensOwed1),
    };
  }
}
