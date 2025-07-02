import { GetUserAssetsResult } from '../types/sdk_results.js';
import { validateWalletAddress } from '../utils/validation.js';
import { HttpClient } from './http_client.js';

/**
 * Service for handling user asset operations.
 * Provides functionality to retrieve user token balances and asset information.
 */
export class Assets {
  constructor(
    private readonly dexBackendBaseUrl: string,
    private readonly httpClient: HttpClient,
  ) {}

  /**
   * Gets all token assets owned by a user with their balances.
   * @param ownerAddress - The wallet address to get assets for.
   * @param page - Page number for pagination (default: 1).
   * @param limit - Maximum number of assets to return per page (default: 10).
   * @returns User assets including token information and balances.
   * @example
   * ```typescript
   * const assets = await assetsService.getUserAssets('eth|123...abc', 1, 20);
   * console.log(`User has ${assets.count} different tokens`);
   * assets.tokens.forEach(token => {
   *   console.log(`${token.symbol}: ${token.quantity}`);
   * });
   * ```
   */
  async getUserAssets(
    ownerAddress: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<GetUserAssetsResult> {
    validateWalletAddress(ownerAddress);

    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Invalid page: must be a positive integer');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('Invalid limit: must be an integer between 1 and 100');
    }

    const json: {
      status: number;
      error: boolean;
      message: string;
      data: {
        token: Array<{
          image: string;
          name: string;
          decimals: string;
          verify: boolean;
          symbol: string;
          quantity: string;
        }>;
        count: number;
      };
    } = await this.httpClient.sendGetRequest(this.dexBackendBaseUrl, '/user/assets', '', {
      address: ownerAddress,
      page: page.toString(),
      limit: limit.toString(),
    });

    return {
      tokens:
        json.data.token.map((token) => ({
          ...token,
          decimals: parseInt(token.decimals, 10),
        })) || [],
      count: json.data.count || 0,
    };
  }
}
