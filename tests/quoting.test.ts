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
            sqrtPrice: '2.1231468040210536',
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

      const result = await quoting.quoteExactOutput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '100',
        FEE_TIER.PERCENT_01_00,
      );

      // The output amount should match what was requested
      expect(result.outTokenAmount.toString()).to.equal('100');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
      // The input amount is calculated by the DEX library based on pool state
      expect(result.inTokenAmount.toNumber()).to.equal(22.40914117);
      // Price impact should be negative (price decreases when selling GALA for SILK)
      expect(result.priceImpact.toNumber()).to.equal(-0.00009419757956978197);
    });

    it('should return correct quote for SILK in, 100 GALA out', async () => {
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
            fee: 10000, // 1% fee tier
            sqrtPrice: '2.1231468040210536',
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
          headers: new Headers(),
          json: async () => mockGetCompositePoolResponse,
          text: async () => JSON.stringify(mockGetCompositePoolResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactOutput(
        'SILK|Unit|none|none',
        'GALA|Unit|none|none',
        '100',
        FEE_TIER.PERCENT_01_00,
      );

      // The output amount should be close to what was requested (may have slight rounding)
      expect(result.outTokenAmount.toNumber()).to.equal(99.99999999);
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
      // The input amount is calculated by the DEX library based on pool state
      expect(result.inTokenAmount.toNumber()).to.equal(455.42521381);
      // Price impact should be negative when selling SILK for GALA
      expect(result.priceImpact.toNumber()).to.equal(-0.00042458428328069625);
    });

    // TODO: could not figure out how to properly mock this so that the fee tier chosen wasn't dependent on the order of the mock responses
    // it('should find best quote across all fee tiers when no fee is specified', async () => {
    //   // Create GetCompositePool mock responses for each fee tier
    //   // Using different sqrtPrice and liquidity values to simulate different pool states
    //   // For quoteExactOutput, we want the 1% fee tier to produce the lowest input amount
    //   // We'll give it both a better price (lower sqrtPrice) AND higher liquidity (less slippage)
    //   const createMockGetCompositePoolResponse = (
    //     sqrtPrice: string,
    //     fee: number,
    //     liquidity: string,
    //     token0Quantity: string = '1000000',
    //     token1Quantity: string = '1000000',
    //   ) => ({
    //     Status: 1,
    //     Data: {
    //       pool: {
    //         token0: 'GALA|Unit|none|none',
    //         token1: 'SILK|Unit|none|none',
    //         token0ClassKey: {
    //           collection: 'GALA',
    //           category: 'Unit',
    //           type: 'none',
    //           additionalKey: 'none',
    //         },
    //         token1ClassKey: {
    //           collection: 'SILK',
    //           category: 'Unit',
    //           type: 'none',
    //           additionalKey: 'none',
    //         },
    //         fee: fee,
    //         sqrtPrice: sqrtPrice,
    //         protocolFees: 0,
    //         bitmap: {},
    //         grossPoolLiquidity: liquidity,
    //         liquidity: liquidity,
    //         feeGrowthGlobal0: '0',
    //         feeGrowthGlobal1: '0',
    //         protocolFeesToken0: '0',
    //         protocolFeesToken1: '0',
    //         tickSpacing: 8,
    //         maxLiquidityPerTick: '1000000000',
    //       },
    //       tickDataMap: {},
    //       token0Balance: {
    //         owner: 'eth|0x0000000000000000000000000000000000000000',
    //         collection: 'GALA',
    //         category: 'Unit',
    //         type: 'none',
    //         additionalKey: 'none',
    //         quantity: token0Quantity,
    //       },
    //       token1Balance: {
    //         owner: 'eth|0x0000000000000000000000000000000000000000',
    //         collection: 'SILK',
    //         category: 'Unit',
    //         type: 'none',
    //         additionalKey: 'none',
    //         quantity: token1Quantity,
    //       },
    //       token0Decimals: 8,
    //       token1Decimals: 8,
    //     },
    //   });

    //   // Use different sqrtPrice values so that the 1% fee tier produces the best (lowest) input amount
    //   // Make the other tiers have worse prices (higher sqrtPrice) so they need more GALA for 100 SILK out
    //   // The 1% tier has a much better price, so even with its higher fee, it wins
    //   // Create separate responses for each fee tier
    //   // Make the 1% tier have an extremely better price AND much higher liquidity to overcome the fee advantage
    //   // Make the price difference extreme so the 1% tier definitely wins
    //   // Lower sqrtPrice = SILK is cheaper = less GALA needed for 100 SILK out
    //   const response0_05 = createMockGetCompositePoolResponse(
    //     '4.5',
    //     500,
    //     '1000000',
    //     '1000000',
    //     '1000000',
    //   ); // 0.05% fee tier - very high price, needs much more input
    //   const response0_30 = createMockGetCompositePoolResponse(
    //     '4.0',
    //     3000,
    //     '1000000',
    //     '1000000',
    //     '1000000',
    //   ); // 0.3% fee tier - very high price, needs much more input
    //   const response1_00 = createMockGetCompositePoolResponse(
    //     '1.5',
    //     10000,
    //     '100000000',
    //     '100000000',
    //     '100000000',
    //   ); // 1% fee tier - much lower price, 100x liquidity, needs much less input (best)

    //   // Store responses in creation order: [0.05%, 0.3%, 1%] (matching quoting.ts line 113)
    //   // NOTE: GetCompositePoolDto from the DEX library doesn't serialize the fee field,
    //   // so we can't identify which fee tier is being requested from the request body.
    //   // However, Promise.all preserves the order of results to match the order of input promises.
    //   // The execution order of async functions may differ from creation order, but we map
    //   // execution index back to creation index to ensure the correct response is returned.
    //   // This makes the mock order-independent: the array can be in any order as long as
    //   // the mapping logic correctly maps execution -> creation.
    //   const responsesByCreationOrder: typeof response0_05[] = [response0_05, response0_30, response1_00];
    //   let executionCount = 0;

    //   mockFetch = async (url: string) => {
    //     // Verify it's calling GetCompositePool endpoint
    //     expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/GetCompositePool`);

    //     // Capture execution index synchronously (before any async operations)
    //     const execIndex = executionCount++;

    //     // Map execution index to creation index
    //     // Based on testing, when Promise.all executes promises in parallel,
    //     // they execute in reverse order of creation: last created executes first
    //     // So: execution 0 -> creation 2 (1% tier), execution 1 -> creation 1 (0.3% tier), execution 2 -> creation 0 (0.05% tier)
    //     const creationIndex = responsesByCreationOrder.length - 1 - execIndex;
    //     const response = responsesByCreationOrder[creationIndex];

    //     if (!response) {
    //       throw new Error(`Invalid creation index: ${creationIndex} for execution ${execIndex}`);
    //     }

    //     return {
    //       ok: true,
    //       status: 200,
    //       headers: new Headers(),
    //       json: async () => response,
    //       text: async () => JSON.stringify(response),
    //     };
    //   };

    //   const httpClient = new HttpClient(mockFetch);
    //   quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

    //   const result = await quoting.quoteExactOutput(
    //     'GALA|Unit|none|none',
    //     'SILK|Unit|none|none',
    //     '100',
    //   );

    //   // The output amount should match what was requested
    //   expect(result.outTokenAmount.toString()).to.equal('100');
    //   // Should have made 3 calls for all fee tiers
    //   expect(executionCount).to.equal(3);
    //   // With the adjusted pool states, the 1% tier should produce the lowest input amount (best quote)
    //   expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
    //   // The input amount is calculated by the DEX library based on pool state
    //   // With the 1% tier having a much better price (sqrtPrice 1.5 vs 4.5), it requires much less input
    //   expect(result.inTokenAmount.toNumber()).to.be.greaterThan(4);
    //   expect(result.inTokenAmount.toNumber()).to.be.lessThan(6);
    // });

    it('should handle BigNumber amounts correctly', async () => {
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
            sqrtPrice: '2.1231468040210536',
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
          headers: new Headers(),
          json: async () => mockGetCompositePoolResponse,
          text: async () => JSON.stringify(mockGetCompositePoolResponse),
        };
      };

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const outputAmount = new BigNumber('200');
      const result = await quoting.quoteExactOutput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        outputAmount,
        FEE_TIER.PERCENT_01_00,
      );

      // The output amount should match what was requested
      expect(result.outTokenAmount.toString()).to.equal('200');
      // The input amount is calculated by the DEX library based on pool state
      // For 200 SILK out, we should need roughly double the input compared to 100 SILK out
      expect(result.inTokenAmount.toNumber()).to.be.greaterThan(40);
      expect(result.inTokenAmount.toNumber()).to.be.lessThan(50);
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
