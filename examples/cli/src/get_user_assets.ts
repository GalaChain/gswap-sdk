import { GSwap, type GetUserAssetsResult } from '@gala-chain/gswap-sdk';

/**
 * Get all asset balances for a specific wallet address.
 * @param ownerAddress - The wallet address to get assets for.
 * @param page - Page number for pagination (default: 1).
 * @param limit - Maximum number of assets to return per page (default: 10).
 * @returns User assets including token information and balances.
 */
export async function getUserAssets(
  ownerAddress: string,
  page: number = 1,
  limit: number = 10,
): Promise<GetUserAssetsResult> {
  const gSwap = new GSwap({
    dexBackendBaseUrl: 'https://dex-backend-dev1.defi.gala.com',
  });

  const assets = await gSwap.assets.getUserAssets(ownerAddress, page, limit);
  return assets;
}
