import { expect } from 'chai';
import { GSwapSDKError } from '../src/classes/gswap_sdk_error.js';
import {
  validateFee,
  validateNumericAmount,
  validatePriceValues,
  validateTickRange,
  validateTickSpacing,
  validateTokenDecimals,
  validateWalletAddress,
} from '../src/utils/validation.js';

describe('Validation Utilities', () => {
  describe('validateNumericAmount', () => {
    it('should accept valid positive numbers', () => {
      expect(() => validateNumericAmount('100', 'amount')).to.not.throw();
      expect(() => validateNumericAmount(100, 'amount')).to.not.throw();
      expect(() => validateNumericAmount('0.01', 'amount')).to.not.throw();
    });

    it('should accept zero when allowZero is true', () => {
      expect(() => validateNumericAmount('0', 'amount', true)).to.not.throw();
      expect(() => validateNumericAmount(0, 'amount', true)).to.not.throw();
    });

    it('should reject zero when allowZero is false', () => {
      expect(() => validateNumericAmount('0', 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be positive',
      );
      expect(() => validateNumericAmount(0, 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be positive',
      );
    });

    it('should reject negative numbers', () => {
      expect(() => validateNumericAmount('-1', 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be positive',
      );
      expect(() => validateNumericAmount(-1, 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be positive',
      );
    });

    it('should reject infinite numbers', () => {
      expect(() => validateNumericAmount(Infinity, 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be a finite number',
      );
      expect(() => validateNumericAmount(-Infinity, 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be a finite number',
      );
    });

    it('should reject NaN', () => {
      expect(() => validateNumericAmount(NaN, 'amount')).to.throw(
        GSwapSDKError,
        'Invalid amount: must be a finite number',
      );
    });

    it('should throw GSwapSDKError with correct code and details', () => {
      try {
        validateNumericAmount('-1', 'testAmount');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_NUMERIC_AMOUNT');
        expect((error as GSwapSDKError).details?.parameterName).to.equal('testAmount');
        expect((error as GSwapSDKError).details?.reason).to.equal('negative');
      }
    });
  });

  describe('validatePriceValues', () => {
    it('should accept valid price values', () => {
      expect(() => validatePriceValues('1', '0.5', '2')).to.not.throw();
      expect(() => validatePriceValues(1, 0.5, 2)).to.not.throw();
    });

    it('should reject when lower price is greater than upper price', () => {
      expect(() => validatePriceValues('1', '2', '1')).to.throw(
        GSwapSDKError,
        'Invalid price range: lower price must be less than or equal to upper price',
      );
    });

    it('should reject negative prices', () => {
      expect(() => validatePriceValues('-1', '0.5', '2')).to.throw(
        GSwapSDKError,
        'Invalid price values: all prices must be finite and positive',
      );
    });

    it('should handle infinite upper price', () => {
      expect(() => validatePriceValues('1', '0.5', Infinity)).to.not.throw();
    });

    it('should throw GSwapSDKError with correct code and details for invalid price range', () => {
      try {
        validatePriceValues('1', '2', '1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_PRICE_RANGE');
        expect((error as GSwapSDKError).details?.lowerPrice).to.equal('2');
        expect((error as GSwapSDKError).details?.upperPrice).to.equal('1');
      }
    });

    it('should throw GSwapSDKError with correct code and details for invalid price values', () => {
      try {
        validatePriceValues('-1', '0.5', '2');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_PRICE_VALUES');
        expect((error as GSwapSDKError).details?.spotPrice).to.equal('-1');
      }
    });
  });

  describe('validateTickRange', () => {
    it('should accept valid tick ranges', () => {
      expect(() => validateTickRange(-1000, 1000)).to.not.throw();
      expect(() => validateTickRange(-886800, 886800)).to.not.throw();
    });

    it('should reject when tickLower >= tickUpper', () => {
      expect(() => validateTickRange(1000, 1000)).to.throw(
        'Invalid tick range: tickLower must be less than tickUpper',
      );
      expect(() => validateTickRange(1000, 999)).to.throw(
        'Invalid tick range: tickLower must be less than tickUpper',
      );
    });

    it('should reject ticks outside valid range', () => {
      expect(() => validateTickRange(-886801, 1000)).to.throw(
        'Invalid tick range: ticks must be between -886800 and 886800',
      );
      expect(() => validateTickRange(-1000, 886801)).to.throw(
        'Invalid tick range: ticks must be between -886800 and 886800',
      );
    });

    it('should reject non-integer ticks', () => {
      expect(() => validateTickRange(-1000.5, 1000)).to.throw(
        'Invalid tick values: ticks must be integers',
      );
      expect(() => validateTickRange(-1000, 1000.5)).to.throw(
        'Invalid tick values: ticks must be integers',
      );
    });

    it('should throw GSwapSDKError with correct code and details for invalid tick range', () => {
      try {
        validateTickRange(1000, 999);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_TICK_RANGE');
        expect((error as GSwapSDKError).details?.tickLower).to.equal(1000);
        expect((error as GSwapSDKError).details?.tickUpper).to.equal(999);
      }
    });

    it('should throw GSwapSDKError with correct code and details for invalid tick bounds', () => {
      try {
        validateTickRange(-886801, 1000);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_TICK_BOUNDS');
        expect((error as GSwapSDKError).details?.tickLower).to.equal(-886801);
        expect((error as GSwapSDKError).details?.minTick).to.equal(-886800);
        expect((error as GSwapSDKError).details?.maxTick).to.equal(886800);
      }
    });

    it('should throw GSwapSDKError with correct code and details for invalid tick values', () => {
      try {
        validateTickRange(-1000.5, 1000);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_TICK_VALUES');
        expect((error as GSwapSDKError).details?.tickLower).to.equal(-1000.5);
      }
    });
  });

  describe('validateFee', () => {
    it('should accept valid fees', () => {
      expect(() => validateFee(500)).to.not.throw();
      expect(() => validateFee(3000)).to.not.throw();
      expect(() => validateFee(10000)).to.not.throw();
      expect(() => validateFee(0)).to.not.throw();
    });

    it('should reject negative fees', () => {
      expect(() => validateFee(-1)).to.throw(
        GSwapSDKError,
        'Invalid fee: must be a non-negative integer',
      );
    });

    it('should reject non-integer fees', () => {
      expect(() => validateFee(500.5)).to.throw(
        GSwapSDKError,
        'Invalid fee: must be a non-negative integer',
      );
    });

    it('should throw GSwapSDKError with correct code and details', () => {
      try {
        validateFee(-1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_FEE');
        expect((error as GSwapSDKError).details?.value).to.equal(-1);
      }
    });
  });

  describe('validateTickSpacing', () => {
    it('should accept valid tick spacing', () => {
      expect(() => validateTickSpacing(1)).to.not.throw();
      expect(() => validateTickSpacing(10)).to.not.throw();
      expect(() => validateTickSpacing(200)).to.not.throw();
    });

    it('should reject zero or negative tick spacing', () => {
      expect(() => validateTickSpacing(0)).to.throw(
        'Invalid tick spacing: must be a positive integer',
      );
      expect(() => validateTickSpacing(-1)).to.throw(
        'Invalid tick spacing: must be a positive integer',
      );
    });

    it('should reject non-integer tick spacing', () => {
      expect(() => validateTickSpacing(10.5)).to.throw(
        'Invalid tick spacing: must be a positive integer',
      );
    });

    it('should throw GSwapSDKError with correct code and details', () => {
      try {
        validateTickSpacing(0);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_TICK_SPACING');
        expect((error as GSwapSDKError).details?.value).to.equal(0);
      }
    });
  });

  describe('validateTokenDecimals', () => {
    it('should accept valid token decimals', () => {
      expect(() => validateTokenDecimals(18, 'decimals')).to.not.throw();
      expect(() => validateTokenDecimals(6, 'decimals')).to.not.throw();
      expect(() => validateTokenDecimals(0, 'decimals')).to.not.throw();
    });

    it('should reject negative decimals', () => {
      expect(() => validateTokenDecimals(-1, 'decimals')).to.throw(
        'Invalid decimals: must be a non-negative integer',
      );
    });

    it('should reject non-integer decimals', () => {
      expect(() => validateTokenDecimals(18.5, 'decimals')).to.throw(
        'Invalid decimals: must be a non-negative integer',
      );
    });

    it('should throw GSwapSDKError with correct code and details', () => {
      try {
        validateTokenDecimals(-1, 'testDecimals');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_TOKEN_DECIMALS');
        expect((error as GSwapSDKError).details?.parameterName).to.equal('testDecimals');
        expect((error as GSwapSDKError).details?.value).to.equal(-1);
      }
    });
  });

  describe('validateWalletAddress', () => {
    it('should accept valid wallet addresses', () => {
      expect(() => validateWalletAddress('eth|123...abc')).to.not.throw();
      expect(() => validateWalletAddress('valid-address')).to.not.throw();
    });

    it('should reject empty or whitespace-only addresses', () => {
      expect(() => validateWalletAddress('')).to.throw(
        'Invalid wallet address: must be a non-empty string',
      );
      expect(() => validateWalletAddress('   ')).to.throw(
        'Invalid wallet address: must be a non-empty string',
      );
    });

    it('should reject non-string addresses', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validateWalletAddress(null as any)).to.throw(
        'Invalid wallet address: must be a non-empty string',
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => validateWalletAddress(undefined as any)).to.throw(
        'Invalid wallet address: No wallet address provided',
      );
    });

    it('should throw GSwapSDKError with correct code and details', () => {
      try {
        validateWalletAddress('');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(GSwapSDKError);
        expect((error as GSwapSDKError).code).to.equal('VALIDATION_ERROR');
        expect((error as GSwapSDKError).details?.type).to.equal('INVALID_WALLET_ADDRESS');
        expect((error as GSwapSDKError).details?.value).to.equal('');
      }
    });
  });
});
