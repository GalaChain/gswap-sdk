import BigNumber from 'bignumber.js';
import { Price, SqrtPrice } from './amounts.js';
import { GalaChainTokenClassKey } from './token.js';

/**
 * Result from getting a price quote for a token swap.
 * Contains pricing information and impact analysis for the proposed trade.
 */
export interface GetQuoteResult {
  /** Raw amount of token0 that would be involved in the swap (ordered by token address) */
  amount0: BigNumber;
  /** Raw amount of token1 that would be involved in the swap (ordered by token address) */
  amount1: BigNumber;
  /** Current square root price of the pool before the trade */
  currentPoolSqrtPrice: SqrtPrice;
  /** New square root price of the pool after the trade would execute */
  newPoolSqrtPrice: SqrtPrice;
  /** Amount of the input token (the token being sold) */
  inTokenAmount: BigNumber;
  /** Amount of the output token (the token being bought) */
  outTokenAmount: BigNumber;
  /** Current price of the pool (how many output tokens per input token) */
  currentPrice: Price;
  /** New price of the pool after the trade (how many output tokens per input token) */
  newPrice: Price;
  /** Price impact of the trade as a percentage (e.g., 0.05 for 0.05% impact) */
  priceImpact: BigNumber;
  /** Fee tier of the pool used for this quote (e.g., 500 for 0.05%, 3000 for 0.3%) */
  feeTier: number;
}

/**
 * Result from getting all liquidity positions for a user.
 * Contains summary information about each position owned by the wallet.
 */
export interface GetUserPositionsResult {
  /** Unique hash identifier for the liquidity pool */
  poolHash: string;
  /** Unique identifier for this specific liquidity position */
  positionId: string;
  /** Token class key for the first token in the pair */
  token0ClassKey: GalaChainTokenClassKey;
  /** Token class key for the second token in the pair */
  token1ClassKey: GalaChainTokenClassKey;
  /** URL or path to the image/icon for token0 */
  token0Img: string;
  /** URL or path to the image/icon for token1 */
  token1Img: string;
  /** Symbol/ticker for token0 (e.g., "GALA") */
  token0Symbol: string;
  /** Symbol/ticker for token1 (e.g., "USDC") */
  token1Symbol: string;
  /** Fee tier of the pool (e.g., 500 for 0.05%, 3000 for 0.3%) */
  fee: number;
  /** Amount of liquidity provided in this position */
  liquidity: BigNumber;
  /** Lower tick boundary of the position's price range */
  tickLower: number;
  /** Upper tick boundary of the position's price range */
  tickUpper: number;
  /** Timestamp when the position was created */
  createdAt: string;
}

/**
 * Result from getting detailed information about a specific liquidity position.
 * Contains comprehensive data about position state, fees, and token information.
 */
export interface GetPositionResult {
  /** Fee tier of the pool (e.g., 500 for 0.05%, 3000 for 0.3%) */
  fee: number;
  /** Fee growth inside the position's tick range for token0 since position creation */
  feeGrowthInside0Last: BigNumber;
  /** Fee growth inside the position's tick range for token1 since position creation */
  feeGrowthInside1Last: BigNumber;
  /** Amount of liquidity provided in this position */
  liquidity: BigNumber;
  /** Unique hash identifier for the liquidity pool */
  poolHash: string;
  /** Unique identifier for this specific liquidity position */
  positionId: string;
  /** Lower tick boundary of the position's price range */
  tickLower: number;
  /** Upper tick boundary of the position's price range */
  tickUpper: number;
  /** Token class key for the first token in the pair (ordered by token address) */
  token0ClassKey: GalaChainTokenClassKey;
  /** Token class key for the second token in the pair (ordered by token address) */
  token1ClassKey: GalaChainTokenClassKey;
  /** Amount of token0 fees accumulated and owed to the position owner */
  tokensOwed0: BigNumber;
  /** Amount of token1 fees accumulated and owed to the position owner */
  tokensOwed1: BigNumber;
}

/**
 * Represents a single asset (token) in a user's wallet.
 * Contains token metadata and balance information.
 */
export interface UserAsset {
  /** URL to the token's icon/image */
  image: string;
  /** Human-readable name of the token */
  name: string;
  /** Number of decimal places this token uses */
  decimals: number;
  /** Whether this token has been verified/approved */
  verify: boolean;
  /** Trading symbol for the token */
  symbol: string;
  /** User's balance of this token as a decimal string */
  quantity: string;
}

/**
 * Result from getting a user's asset balances.
 * Contains paginated list of tokens and their balances.
 */
export interface GetUserAssetsResult {
  /** Array of tokens owned by the user */
  tokens: UserAsset[];
  /** Total number of different tokens the user owns */
  count: number;
}
