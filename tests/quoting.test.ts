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
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '1',
          amount1: '-4.48129773',
          currentSqrtPrice: '2.127616971760491976',
          newSqrtPrice: '2.127527383944345981',
        },
      };

      mockFetch = async () => {
        return {
          ok: true,
          status: 200,
          json: async () => mockApiResponse,
          text: async () => JSON.stringify(mockApiResponse),
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
      expect(result.outTokenAmount.toString()).to.equal('4.48129773');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);

      // Verify the actual output amount matches expected (4.48129773 SILK)
      expect(result.outTokenAmount.toString()).to.equal('4.48129773');
    });

    it('should handle string token identifiers', async () => {
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '1',
          amount1: '-4.48129773',
          currentSqrtPrice: '2.127616971760491976',
          newSqrtPrice: '2.127527383944345981',
        },
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
        text: async () => JSON.stringify(mockApiResponse),
      });

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactInput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '1',
        FEE_TIER.PERCENT_01_00,
      );

      expect(result.outTokenAmount.toString()).to.equal('4.48129773');
    });

    it('should find best quote across all fee tiers when no fee is specified', async () => {
      let callCount = 0;

      const mockApiResponses = [
        {
          Status: 1,
          Data: {
            amount0: '1',
            amount1: '-4.4', // Lower output for 0.05%
            currentSqrtPrice: '2.127616971760491976',
            newSqrtPrice: '2.127527383944345981',
          },
        },
        {
          Status: 1,
          Data: {
            amount0: '1',
            amount1: '-4.45', // Medium output for 0.3%
            currentSqrtPrice: '2.127616971760491976',
            newSqrtPrice: '2.127527383944345981',
          },
        },
        {
          Status: 1,
          Data: {
            amount0: '1',
            amount1: '-4.48129773', // Best output for 1%
            currentSqrtPrice: '2.127616971760491976',
            newSqrtPrice: '2.127527383944345981',
          },
        },
      ];

      mockFetch = async () => {
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

      expect(result.outTokenAmount.toString()).to.equal('4.48129773');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_01_00);
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
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '1',
          amount1: '-4.46248731',
          currentSqrtPrice: '2.1231468040210536', // Example current price
          newSqrtPrice: '2.12305759225329817', // Slightly lower after swap
        },
      };

      mockFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => mockApiResponse,
        text: async () => JSON.stringify(mockApiResponse),
      });

      const httpClient = new HttpClient(mockFetch);
      quoting = new Quoting(gatewayBaseUrl, dexContractBasePath, httpClient);

      const result = await quoting.quoteExactInput(
        'GALA|Unit|none|none',
        'SILK|Unit|none|none',
        '1',
        FEE_TIER.PERCENT_01_00,
      );

      expect(result.priceImpact).to.be.instanceOf(BigNumber);
      expect(result.currentPrice).to.be.instanceOf(BigNumber);
      expect(result.newPrice).to.be.instanceOf(BigNumber);

      expect(result.priceImpact.toString()).to.equal(
        BigNumber('-0.00008403553942416076').toString(),
      );
    });

    it('should return correct quote for 1 SILK to GALA at 0.05% fee tier', async () => {
      const mockApiResponse = {
        Status: 1,
        Data: {
          amount0: '-0.28928886',
          amount1: '1',
          currentSqrtPrice: '1.824917518824836488',
          newSqrtPrice: '1.893249486307725229',
        },
      };

      mockFetch = async (url: string, options?: RequestInit) => {
        expect(url).to.equal(`${gatewayBaseUrl}${dexContractBasePath}/QuoteExactAmount`);
        expect(options?.method).to.equal('POST');

        const requestBody = JSON.parse(options?.body as string);
        expect(requestBody.fee).to.equal(500);
        expect(requestBody.amount).to.equal('1');

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

      const result = await quoting.quoteExactInput(
        'SILK|Unit|none|none',
        'GALA|Unit|none|none',
        '1',
        FEE_TIER.PERCENT_00_05,
      );

      expect(result.inTokenAmount.toString()).to.equal('1');
      expect(result.outTokenAmount.toString()).to.equal('0.28928886');
      expect(result.feeTier).to.equal(FEE_TIER.PERCENT_00_05);
      expect(result.priceImpact.toString()).to.equal('-0.07088218929333023207');
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
