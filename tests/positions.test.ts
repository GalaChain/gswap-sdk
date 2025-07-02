import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { Bundler } from '../src/classes/bundler.js';
import { HttpClient } from '../src/classes/http_client.js';
import { Pools } from '../src/classes/pools.js';
import { Positions } from '../src/classes/positions.js';
import { GalaChainSigner } from '../src/classes/signers.js';
import type { PriceIn } from '../src/types/amounts.js';
import type { HttpRequestor } from '../src/types/http_requestor.js';

interface MockBundlerRequest {
  method: string;
  body: Record<string, unknown>;
  stringsInstructions: string[];
}

class MockSigner implements GalaChainSigner {
  async signObject<TObjectType extends Record<string, unknown>>(
    _methodName: string,
    obj: TObjectType,
  ): Promise<TObjectType & { signature: string }> {
    return { ...obj, signature: 'mock-signature' };
  }
}

describe('Positions', () => {
  let positions: Positions;
  let mockFetch: HttpRequestor;
  let mockBundlerRequest: MockBundlerRequest | undefined;
  let bundler: Bundler;
  let pools: Pools;
  const gatewayBaseUrl = 'https://dex-api.galaswap.gala.com';
  const dexContractBasePath = '/asset-api/contract-methods/GswapApi';
  const bundlerBaseUrl = 'https://bundler.galaswap.gala.com';
  const bundlingAPIBasePath = '/bundling-api';

  beforeEach(() => {
    mockBundlerRequest = undefined;

    // Mock fetch that will be used by HttpClient
    mockFetch = async (url: string, options?: RequestInit): Promise<Response> => {
      const body = JSON.parse((options?.body as string) || '{}');

      // Capture bundler requests
      if (url.includes('/bundling-api')) {
        mockBundlerRequest = {
          method: body.method,
          body: body.signedDto,
          stringsInstructions: body.stringsInstructions,
        };

        // Return mock successful bundler response
        return new Response(
          JSON.stringify({
            data: 'mock-tx-id-12345',
            message: 'Transaction submitted successfully',
            error: false,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      throw new Error(`Mock fetch not configured for URL: ${url}`);
    };

    const httpClient = new HttpClient(mockFetch);

    const mockSigner = new MockSigner();
    bundler = new Bundler(
      bundlerBaseUrl,
      bundlingAPIBasePath,
      30000, // 30 second timeout
      mockSigner,
      httpClient,
    );

    pools = new Pools(gatewayBaseUrl, dexContractBasePath, httpClient);

    positions = new Positions(gatewayBaseUrl, dexContractBasePath, bundler, pools, httpClient);
  });

  describe('addLiquidityByPrice', () => {
    it('should calculate correct ticks for GALA/SILK position', async () => {
      await positions.addLiquidityByPrice({
        walletAddress: 'eth|123...abc',
        positionId: '',
        token0: 'GALA|Unit|none|none',
        token1: 'SILK|Unit|none|none',
        fee: 10000,
        tickSpacing: 200,
        minPrice: 5 as PriceIn,
        maxPrice: 20 as PriceIn,
        amount0Desired: '1',
        amount1Desired: '1',
        amount0Min: '1',
        amount1Min: '1',
      });

      if (!mockBundlerRequest) {
        throw new Error('Expected bundler request to be captured');
      }

      expect(mockBundlerRequest.method).to.equal('AddLiquidity');
      expect(mockBundlerRequest.body.tickLower).to.equal(16000);
      expect(mockBundlerRequest.body.tickUpper).to.equal(29800);
      expect(mockBundlerRequest.body.fee).to.equal(10000);
      expect(mockBundlerRequest.body.amount0Desired).to.equal('1');
      expect(mockBundlerRequest.body.amount1Desired).to.equal('1');
      expect(mockBundlerRequest.body.amount0Min).to.equal('1');
      expect(mockBundlerRequest.body.amount1Min).to.equal('1');
    });

    it('should handle BigNumber amounts correctly', async () => {
      await positions.addLiquidityByPrice({
        walletAddress: 'eth|123...abc',
        positionId: '',
        token0: 'GALA|Unit|none|none',
        token1: 'SILK|Unit|none|none',
        fee: 10000,
        tickSpacing: 200,
        minPrice: new BigNumber('5') as PriceIn,
        maxPrice: new BigNumber('20') as PriceIn,
        amount0Desired: new BigNumber('10.5'),
        amount1Desired: new BigNumber('15.25'),
        amount0Min: new BigNumber('9.5'),
        amount1Min: new BigNumber('14.0'),
      });

      if (!mockBundlerRequest) {
        throw new Error('Expected bundler request to be captured');
      }
      expect(mockBundlerRequest.body.amount0Desired?.toString()).to.equal('10.5');
      expect(mockBundlerRequest.body.amount1Desired?.toString()).to.equal('15.25');
      expect(mockBundlerRequest.body.amount0Min?.toString()).to.equal('9.5');
      expect(mockBundlerRequest.body.amount1Min?.toString()).to.equal('14');
    });
  });
});
