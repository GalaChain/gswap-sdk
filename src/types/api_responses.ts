import BigNumber from 'bignumber.js';
import { SqrtPrice } from './amounts.js';

export interface QuoteExactAmountRawResponse {
  amount0: string;
  amount1: string;
  currentSqrtPrice: string;
  newSqrtPrice: string;
}

export interface QuoteExactAmountResponse {
  amount0: BigNumber;
  amount1: BigNumber;
  currentSqrtPrice: SqrtPrice;
  newSqrtPrice: SqrtPrice;
}

export interface GetPoolDataRawResponse {
  bitmap: Record<string, string>;
  fee: number;
  feeGrowthGlobal0: string;
  feeGrowthGlobal1: string;
  grossPoolLiquidity: string;
  liquidity: string;
  maxLiquidityPerTick: string;
  protocolFees: number;
  protocolFeesToken0: string;
  protocolFeesToken1: string;
  sqrtPrice: string;
  tickSpacing: number;
  token0: string;
  token0ClassKey: {
    additionalKey: string;
    category: string;
    collection: string;
    type: string;
  };
  token1: string;
  token1ClassKey: {
    additionalKey: string;
    category: string;
    collection: string;
    type: string;
  };
}

export interface GetPoolDataResponse {
  bitmap: Record<string, string>;
  fee: number;
  feeGrowthGlobal0: BigNumber;
  feeGrowthGlobal1: BigNumber;
  grossPoolLiquidity: BigNumber;
  liquidity: BigNumber;
  maxLiquidityPerTick: BigNumber;
  protocolFees: number;
  protocolFeesToken0: BigNumber;
  protocolFeesToken1: BigNumber;
  sqrtPrice: SqrtPrice;
  tickSpacing: number;
  token0: string;
  token0ClassKey: {
    additionalKey: string;
    category: string;
    collection: string;
    type: string;
  };
  token1: string;
  token1ClassKey: {
    additionalKey: string;
    category: string;
    collection: string;
    type: string;
  };
}

export interface TransactionPendingResponse {
  data: string;
  message: string;
  error: boolean;
}
