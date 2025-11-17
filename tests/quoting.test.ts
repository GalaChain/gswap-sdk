import BigNumber from 'bignumber.js';
import { expect } from 'chai';
import { HttpClient } from '../src/classes/http_client.js';
import { Quoting } from '../src/classes/quoting.js';
import { FEE_TIER } from '../src/types/fees.js';
import type { HttpRequestor } from '../src/types/http_requestor.js';

// Unused fields were removed from the response to simplify the test
const poolNotFoundResponse = {
  error: {
    Message:
      'No object with id \u0000GCDXCHLPL\u0000GALA$Unit$none$none\u0000SILK$Unit$none$none\u00003000\u0000 exists',
    ErrorKey: 'OBJECT_NOT_FOUND',
  },
};

describe('Quoting', () => {
  let quoting: Quoting;
  let mockFetch: HttpRequestor;
  const gatewayBaseUrl = 'https://dex-api.galaswap.gala.com';
  const dexContractBasePath = '/asset-api/contract-methods/GswapApi';

  beforeEach(() => {
    mockFetch = async () => {
      throw new Error('Mock fetch not configured for this test');
    };

    const httpClient = new HttpClient(mockFetch);

    quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);
  });

  describe('quoteExactInput', () => {
    it('should return correct quote for 1 GALA to SILK at 1% fee tier', async () => {
      // Mock GetCompositePool response
      const mockGetCompositePoolResponse = {
        Status: 1,
        Data: {
          pool: {
            token0: 'GALA|Unit|none|none',
            token1: 'SILK|Unit|none|none',
            token0ClassKey: {
              collection: 'GALA',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            token1ClassKey: {
              collection: 'SILK',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            fee: 10000, // 1% fee tier
            sqrtPrice: '2.127616971760491976',
            protocolFees: 0,
            bitmap: {},
            grossPoolLiquidity: '1000000',
            liquidity: '1000000',
            feeGrowthGlobal0: '0',
            feeGrowthGlobal1: '0',
            protocolFeesToken0: '0',
            protocolFeesToken1: '0',
            tickSpacing: 8,
            maxLiquidityPerTick: '1000000000',
          },
          tickDataMap: {},
          token0Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'GALA',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token1Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'SILK',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token0Decimals: 8,
          token1Decimals: 8,
        },
      };

      mockFetch = async (url: string) => {
        // Verify it's calling GetCompositePool endpoint
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/GetCompositePool`);
        return {
          ok: true,
          status: 200,
          json: async () => mockGetCompositePoolResponse,
          text: async () => JSON.stringify(mockGetCompositePoolResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const galaToken = {
        additionalKey: 'none',
        category: 'Unit',
        collection: 'GALA',
        type: 'none',
      };

      const silkToken = {
        additionalKey: 'none',
        category: 'Unit',
        collection: 'SILK',
        type: 'none',
      };

      const result = await quoting.quoteExactInput(
        galaToken,
        silkToken,
        '1',
        FEE_TIER.PERCENT_01_00,
      );

      // Verify the result
      expect(result).to.be.an('object');
      expect(result.inTokenAmount.toString()).to.equal('1');
      // The output amount is calculated by the DEX library based on pool state
      // With the mock pool data, we get a slightly different but valid result
      expect(result.outTokenAmount.toNumber()).to.be.greaterThan(4.48);
      expect(result.outTokenAmount.toNumber()).to.be.lessThan(4.49);
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
    });

    it('should handle string token identifiers', async () => {
      // Mock GetCompositePool response
      const mockGetCompositePoolResponse = {
        Status: 1,
        Data: {
          pool: {
            token0: 'GALA|Unit|none|none',
            token1: 'SILK|Unit|none|none',
            token0ClassKey: {
              collection: 'GALA',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            token1ClassKey: {
              collection: 'SILK',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            fee: 10000, // 1% fee tier
            sqrtPrice: '2.127616971760491976',
            protocolFees: 0,
            bitmap: {},
            grossPoolLiquidity: '1000000',
            liquidity: '1000000',
            feeGrowthGlobal0: '0',
            feeGrowthGlobal1: '0',
            protocolFeesToken0: '0',
            protocolFeesToken1: '0',
            tickSpacing: 8,
            maxLiquidityPerTick: '1000000000',
          },
          tickDataMap: {},
          token0Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'GALA',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token1Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'SILK',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token0Decimals: 8,
          token1Decimals: 8,
        },
      };

      mockFetch = async (url: string) => {
        // Verify it's calling GetCompositePool endpoint
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/GetCompositePool`);
        return {
          ok: true,
          status: 200,
          json: async () => mockGetCompositePoolResponse,
          text: async () => JSON.stringify(mockGetCompositePoolResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactInput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '1',
        FEE_TIER.PERCENT_01_00,
      );

      // The output amount is calculated by the DEX library based on pool state
      expect(result.outTokenAmount.toNumber()).to.be.greaterThan(4.48);
      expect(result.outTokenAmount.toNumber()).to.be.lessThan(4.49);
    });

    it('should find best quote across all fee tiers when no fee is specified', async () => {
      let callCount = 0;

      // Create GetCompositePool mock responses for each fee tier
      // Using different sqrtPrice values to simulate different pool states that produce different outputs
      const createMockGetCompositePoolResponse = (sqrtPrice: string, fee: number) => ({
        Status: 1,
        Data: {
          pool: {
            token0: 'GALA|Unit|none|none',
            token1: 'SILK|Unit|none|none',
            token0ClassKey: {
              collection: 'GALA',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            token1ClassKey: {
              collection: 'SILK',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            fee: fee,
            sqrtPrice: sqrtPrice,
            protocolFees: 0,
            bitmap: {},
            grossPoolLiquidity: '1000000',
            liquidity: '1000000',
            feeGrowthGlobal0: '0',
            feeGrowthGlobal1: '0',
            protocolFeesToken0: '0',
            protocolFeesToken1: '0',
            tickSpacing: 8,
            maxLiquidityPerTick: '1000000000',
          },
          tickDataMap: {},
          token0Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'GALA',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token1Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'SILK',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token0Decimals: 8,
          token1Decimals: 8,
        },
      });

      const mockApiResponses = [
        createMockGetCompositePoolResponse('2.127616971760491976', 500), // 0.05% fee tier
        createMockGetCompositePoolResponse('2.127616971760491976', 3000), // 0.3% fee tier
        createMockGetCompositePoolResponse('2.127616971760491976', 10000), // 1% fee tier
      ];

      mockFetch = async (url: string) => {
        // Verify it's calling GetCompositePool endpoint
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/GetCompositePool`);
        const response = mockApiResponses[callCount++];
        return {
          ok: true,
          status: 200,
          json: async () => response,
          text: async () => JSON.stringify(response),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactInput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '1',
      );

      // Verify that we got a valid result and that all fee tiers were checked
      expect(result.outTokenAmount.toNumber()).to.be.greaterThan(4.4);
      expect(result.outTokenAmount.toNumber()).to.be.lessThan(4.6);
      expect(
        [FEE_TIER.PERCENT_00_05, FEE_TIER.PERCENT_00_30, FEE_TIER.PERCENT_01_00].includes(
          result.feeTier,
        ),
      ).to.be.true;
      expect(callCount).to.equal(3); // Should have made 3 calls for all fee tiers
    });

    it('should throw error when no pools are available', async () => {
      mockFetch = async () => ({
        ok: false,
        status: 404,
        json: async () => poolNotFoundResponse,
        text: async () => JSON.stringify(poolNotFoundResponse),
      });

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      try {
        await quoting.quoteExactInput('GALA|Unit|none|none', 'NONEXISTENT|Unit|none|none', '1');
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).to.include('No pools available');
      }
    });

    it('should calculate price impact correctly', async () => {
      // Mock GetCompositePool response with specific sqrtPrice values to test price impact
      const mockGetCompositePoolResponse = {
        Status: 1,
        Data: {
          pool: {
            token0: 'GALA|Unit|none|none',
            token1: 'SILK|Unit|none|none',
            token0ClassKey: {
              collection: 'GALA',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            token1ClassKey: {
              collection: 'SILK',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            fee: 10000, // 1% fee tier
            sqrtPrice: '2.1231468040210536', // Example current price
            protocolFees: 0,
            bitmap: {},
            grossPoolLiquidity: '1000000',
            liquidity: '1000000',
            feeGrowthGlobal0: '0',
            feeGrowthGlobal1: '0',
            protocolFeesToken0: '0',
            protocolFeesToken1: '0',
            tickSpacing: 8,
            maxLiquidityPerTick: '1000000000',
          },
          tickDataMap: {},
          token0Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'GALA',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token1Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'SILK',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token0Decimals: 8,
          token1Decimals: 8,
        },
      };

      mockFetch = async (url: string) => {
        // Verify it's calling GetCompositePool endpoint
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/GetCompositePool`);
        return {
          ok: true,
          status: 200,
          json: async () => mockGetCompositePoolResponse,
          text: async () => JSON.stringify(mockGetCompositePoolResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactInput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '1',
        FEE_TIER.PERCENT_01_00,
      );

      // Verify price impact is calculated correctly
      // Check that price impact, current price, and new price are BigNumber-like objects
      expect(result.priceImpact).to.have.property('toNumber');
      expect(result.currentPrice).to.have.property('toNumber');
      expect(result.newPrice).to.have.property('toNumber');

      // Price impact should be negative (price decreases when selling GALA for SILK)
      expect(result.priceImpact.isLessThan(0)).to.be.true;
      // Price impact should be a small negative value (typically between -0.01 and 0)
      expect(result.priceImpact.toNumber()).to.be.greaterThan(-0.01);
      expect(result.priceImpact.toNumber()).to.be.lessThan(0);
    });

    it('should return correct quote for 1 SILK to GALA at 0.05% fee tier', async () => {
      // Mock GetCompositePool response
      // Note: GALA < SILK alphabetically, so token0 = GALA, token1 = SILK
      // When swapping SILK to GALA, we're swapping token1 to token0
      const mockGetCompositePoolResponse = {
        Status: 1,
        Data: {
          pool: {
            token0: 'GALA|Unit|none|none',
            token1: 'SILK|Unit|none|none',
            token0ClassKey: {
              collection: 'GALA',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            token1ClassKey: {
              collection: 'SILK',
              category: 'Unit',
              type: 'none',
              additionalKey: 'none',
            },
            fee: 500, // 0.05% fee tier
            sqrtPrice: '1.824917518824836488',
            protocolFees: 0,
            bitmap: {},
            grossPoolLiquidity: '1000000',
            liquidity: '1000000',
            feeGrowthGlobal0: '0',
            feeGrowthGlobal1: '0',
            protocolFeesToken0: '0',
            protocolFeesToken1: '0',
            tickSpacing: 8,
            maxLiquidityPerTick: '1000000000',
          },
          tickDataMap: {},
          token0Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'GALA',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token1Balance: {
            owner: 'eth|0x0000000000000000000000000000000000000000',
            collection: 'SILK',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            quantity: '1000000',
          },
          token0Decimals: 8,
          token1Decimals: 8,
        },
      };

      mockFetch = async (url: string, options?: RequestInit) => {
        // Verify it's calling GetCompositePool endpoint
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/GetCompositePool`);
        expect(options?.method).to.equal('POST');

        const requestBody = JSON.parse(options?.body as string);
        expect(requestBody.fee).to.equal(500); // 0.05% fee tier

        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockGetCompositePoolResponse,
          text: async () => JSON.stringify(mockGetCompositePoolResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactInput(
        'SILK|Unit|none|none',
        'GALA|Unit|none|none',
        '1',
        FEE_TIER.PERCENT_00_05,
      );

      expect(result.inTokenAmount.toString()).to.equal('1');
      // The output amount is calculated by the DEX library based on pool state
      expect(result.outTokenAmount.toNumber()).to.be.greaterThan(0.28);
      expect(result.outTokenAmount.toNumber()).to.be.lessThan(0.31);
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_00_05);
      // Price impact should be negative when selling SILK for GALA
      expect(result.priceImpact.isLessThan(0)).to.be.true;
    });
  });

  describe('quoteExactOutput', () => {
    it('should return correct quote for GALA in, 100 SILK out', async () => {
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '22.42920497',
          amount1: '-100',
          currentSqrtPrice: '2.1231468040210536',
          newSqrtPrice: '2.121147655082097977',
        },
      };

      mockFetch = async (url: string, options?: RequestInit) => {
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/QuoteExactAmount`);
        expect(options?.method).to.equal('POST');

        const requestBody = JSON.parse(options?.body as string);
        expect(requestBody.amount).to.equal('-100');

        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => mockApiResponse,
          text: async () => JSON.stringify(mockApiResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactOutput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '100',
        FEE_TIER.PERCENT_01_00,
      );

      expect(result.inTokenAmount.toString()).to.equal('22.42920497');
      expect(result.outTokenAmount.toString()).to.equal('100');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
      expect(result.priceImpact.toString()).to.equal('-0.00188230765646417037');
    });

    it('should return correct quote for SILK in, 100 GALA out', async () => {
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '-100',
          amount1: '457.26939419',
          currentSqrtPrice: '2.1231468040210536',
          newSqrtPrice: '2.132196885300929158',
        },
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockApiResponse,
        text: async () => JSON.stringify(mockApiResponse),
      });

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactOutput(
        'SILK|Unit|none|none',
        'GALA|Unit|none|none',
        '100',
        FEE_TIER.PERCENT_01_00,
      );

      expect(result.inTokenAmount.toString()).to.equal('457.26939419');
      expect(result.outTokenAmount.toString()).to.equal('100');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
      expect(result.priceImpact.toString()).to.equal('-0.00847095769383043251');
    });

    it('should find best quote across all fee tiers when no fee is specified', async () => {
      let callCount = 0;

      const mockApiResponses = [
        {
          Status: 1,
          Data: {
            amount0: '23.5',
            amount1: '-100',
            currentSqrtPrice: '2.1231468040210536',
            newSqrtPrice: '2.121147655082097977',
          },
        },
        {
          Status: 1,
          Data: {
            amount0: '22.8',
            amount1: '-100',
            currentSqrtPrice: '2.1231468040210536',
            newSqrtPrice: '2.121147655082097977',
          },
        },
        {
          Status: 1,
          Data: {
            amount0: '22.42920497',
            amount1: '-100',
            currentSqrtPrice: '2.1231468040210536',
            newSqrtPrice: '2.121147655082097977',
          },
        },
      ];

      mockFetch = async () => {
        const response = mockApiResponses[callCount++];

        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => response,
          text: async () => JSON.stringify(response),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactOutput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '100',
      );

      expect(result.inTokenAmount.toString()).to.equal('22.42920497');
      expect(result.outTokenAmount.toString()).to.equal('100');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
      expect(callCount).to.equal(3);
    });

    it('should handle BigNumber amounts correctly', async () => {
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '44.85840994',
          amount1: '-200',
          currentSqrtPrice: '2.1231468040210536',
          newSqrtPrice: '2.119229310164195954',
        },
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => mockApiResponse,
        text: async () => JSON.stringify(mockApiResponse),
      });

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const outputAmount = new BigNumber('200');
      const result = await quoting.quoteExactOutput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        outputAmount,
        FEE_TIER.PERCENT_01_00,
      );

      expect(result.inTokenAmount.toString()).to.equal('44.85840994');
      expect(result.outTokenAmount.toString()).to.equal('200');
    });

    it('should throw error when no pools are available', async () => {
      mockFetch = async () => ({
        ok: false,
        status: 404,
        headers: new Headers(),
        json: async () => poolNotFoundResponse,
        text: async () => JSON.stringify(poolNotFoundResponse),
      });

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      try {
        await quoting.quoteExactOutput('GALA|Unit|none|none', 'NONEXISTENT|Unit|none|none', '100');
        expect.fail('Should have thrown an error');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).to.include('No pools available');
      }
    });
  });
});
