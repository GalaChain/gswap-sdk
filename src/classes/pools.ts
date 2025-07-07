import BigNumber from 'bignumber.js';
import { Price, PriceIn, SqrtPrice, SqrtPriceIn } from '../types/amounts.js';
import { GetPoolDataRawResponse, GetPoolDataResponse } from '../types/api_responses.js';
import { GalaChainTokenClassKey } from '../types/token.js';
import { getTokenOrdering, parseTokenClassKey } from '../utils/token.js';
import { validateFee, validateNumericAmount, validateTickSpacing } from '../utils/validation.js';
import { HttpClient } from './http_client.js';

export class Pools {
  constructor(
    private readonly gatewayBaseUrl: string,
    private readonly dexContractBasePath: string,
    private readonly httpClient: HttpClient,
  ) {}

  /**
   * Gets pool data for a specific token pair and fee tier.
   */
  async getPoolData(
    token0: GalaChainTokenClassKey | string,
    token1: GalaChainTokenClassKey | string,
    fee: number,
  ): Promise<GetPoolDataResponse> {
    validateFee(fee);

    const token0Class = parseTokenClassKey(token0);
    const token1Class = parseTokenClassKey(token1);
    const ordering = getTokenOrdering(token0Class, token1Class, false);

    const responseBody = await this.httpClient.sendPostRequest<{
      Status: number;
      Data: GetPoolDataRawResponse;
    }>(this.gatewayBaseUrl, this.dexContractBasePath, '/GetPoolData', {
      token0: ordering.token0,
      token1: ordering.token1,
      fee: fee,
    });

    const rawData = responseBody.Data;

    return {
      bitmap: rawData.bitmap,
      fee: rawData.fee,
      feeGrowthGlobal0: BigNumber(rawData.feeGrowthGlobal0),
      feeGrowthGlobal1: BigNumber(rawData.feeGrowthGlobal1),
      grossPoolLiquidity: BigNumber(rawData.grossPoolLiquidity),
      liquidity: BigNumber(rawData.liquidity),
      maxLiquidityPerTick: BigNumber(rawData.maxLiquidityPerTick),
      protocolFees: rawData.protocolFees,
      protocolFeesToken0: BigNumber(rawData.protocolFeesToken0),
      protocolFeesToken1: BigNumber(rawData.protocolFeesToken1),
      sqrtPrice: BigNumber(rawData.sqrtPrice) as SqrtPrice,
      tickSpacing: rawData.tickSpacing,
      token0: rawData.token0,
      token0ClassKey: rawData.token0ClassKey,
      token1: rawData.token1,
      token1ClassKey: rawData.token1ClassKey,
    };
  }

  /**
   * Calculates the nearest valid tick value for a given price.
   */
  calculateTicksForPrice(price: PriceIn, tickSpacing: number): number {
    validateNumericAmount(price, 'price', true);
    validateTickSpacing(tickSpacing);

    const priceNumber = BigNumber(price).toNumber();

    if (priceNumber === 0) {
      return -886800;
    }

    if (priceNumber === Infinity) {
      return 886800;
    }

    const uncoercedTicks = Math.round(Math.log(priceNumber) / Math.log(1.0001));
    const ticks = Math.floor(uncoercedTicks / tickSpacing) * tickSpacing;

    return Math.min(Math.max(ticks, -886800), 886800);
  }

  calculatePriceForTicks(tick: number): Price {
    if (tick === -886800) {
      return BigNumber('0') as Price;
    } else if (tick === 886800) {
      return BigNumber(Infinity) as Price;
    } else {
      const price = Math.pow(1.0001, tick);
      return BigNumber(price) as Price;
    }
  }

  /**
   * Calculates the current spot price of a pool based on sqrt price.
   * Price is defined as the amount of outToken you would receive for 1 inToken.
   */
  calculateSpotPrice(
    inToken: GalaChainTokenClassKey | string,
    outToken: GalaChainTokenClassKey | string,
    poolSqrtPrice: SqrtPriceIn,
  ): BigNumber {
    validateNumericAmount(poolSqrtPrice, 'poolSqrtPrice');

    const ordering = getTokenOrdering(inToken, outToken, false);
    const poolPrice = BigNumber(poolSqrtPrice).pow(2);

    if (ordering.zeroForOne) {
      return poolPrice;
    } else {
      return BigNumber(1).div(poolPrice);
    }
  }
}
