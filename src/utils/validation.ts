import BigNumber from 'bignumber.js';
import { GSwapSDKError } from '../classes/gswap_sdk_error.js';
import { NumericAmount } from '../types/amounts.js';

export function validateNumericAmount(
  amount: NumericAmount,
  parameterName: string,
  allowZero = false,
): void {
  const bnAmount = BigNumber(amount);

  if (!bnAmount.isFinite()) {
    throw new GSwapSDKError(
      `Invalid ${parameterName}: must be a finite number`,
      'VALIDATION_ERROR',
      {
        type: 'INVALID_NUMERIC_AMOUNT',
        parameterName,
        value: amount,
        reason: 'not_finite',
      },
    );
  }

  if (!allowZero && bnAmount.isZero()) {
    throw new GSwapSDKError(`Invalid ${parameterName}: must be positive`, 'VALIDATION_ERROR', {
      type: 'INVALID_NUMERIC_AMOUNT',
      parameterName,
      value: amount,
      reason: 'zero_not_allowed',
    });
  }

  if (bnAmount.isNegative()) {
    throw new GSwapSDKError(
      `Invalid ${parameterName}: must be ${allowZero ? 'non-negative' : 'positive'}`,
      'VALIDATION_ERROR',
      {
        type: 'INVALID_NUMERIC_AMOUNT',
        parameterName,
        value: amount,
        reason: 'negative',
      },
    );
  }
}

export function validatePriceValues(
  spotPrice: NumericAmount,
  lowerPrice: NumericAmount,
  upperPrice: NumericAmount,
): void {
  const bnSpotPrice = BigNumber(spotPrice);
  const bnLowerPrice = BigNumber(lowerPrice);
  let bnUpperPrice = BigNumber(upperPrice);

  bnUpperPrice = bnUpperPrice.isFinite() ? bnUpperPrice : BigNumber(1e18);

  if (
    !bnSpotPrice.isFinite() ||
    !bnLowerPrice.isFinite() ||
    !bnUpperPrice.isFinite() ||
    !bnSpotPrice.isPositive() ||
    !bnLowerPrice.isPositive() ||
    !bnUpperPrice.isPositive()
  ) {
    throw new GSwapSDKError(
      'Invalid price values: all prices must be finite and positive',
      'VALIDATION_ERROR',
      {
        type: 'INVALID_PRICE_VALUES',
        spotPrice,
        lowerPrice,
        upperPrice,
      },
    );
  }

  if (bnLowerPrice.isGreaterThan(bnUpperPrice)) {
    throw new GSwapSDKError(
      'Invalid price range: lower price must be less than or equal to upper price',
      'VALIDATION_ERROR',
      {
        type: 'INVALID_PRICE_RANGE',
        lowerPrice,
        upperPrice,
      },
    );
  }
}

export function validateTokenDecimals(decimals: number, parameterName: string): void {
  if (decimals < 0 || !Number.isInteger(decimals)) {
    throw new GSwapSDKError(
      `Invalid ${parameterName}: must be a non-negative integer`,
      'VALIDATION_ERROR',
      {
        type: 'INVALID_TOKEN_DECIMALS',
        parameterName,
        value: decimals,
      },
    );
  }
}

export function validateTickRange(tickLower: number, tickUpper: number): void {
  if (!Number.isInteger(tickLower) || !Number.isInteger(tickUpper)) {
    throw new GSwapSDKError('Invalid tick values: ticks must be integers', 'VALIDATION_ERROR', {
      type: 'INVALID_TICK_VALUES',
      tickLower,
      tickUpper,
    });
  }

  if (tickLower >= tickUpper) {
    throw new GSwapSDKError(
      'Invalid tick range: tickLower must be less than tickUpper',
      'VALIDATION_ERROR',
      {
        type: 'INVALID_TICK_RANGE',
        tickLower,
        tickUpper,
      },
    );
  }

  if (tickLower < -886800 || tickUpper > 886800) {
    throw new GSwapSDKError(
      'Invalid tick range: ticks must be between -886800 and 886800',
      'VALIDATION_ERROR',
      {
        type: 'INVALID_TICK_BOUNDS',
        tickLower,
        tickUpper,
        minTick: -886800,
        maxTick: 886800,
      },
    );
  }
}

export function validateFee(fee: number): void {
  if (!Number.isInteger(fee) || fee < 0) {
    throw new GSwapSDKError('Invalid fee: must be a non-negative integer', 'VALIDATION_ERROR', {
      type: 'INVALID_FEE',
      value: fee,
    });
  }
}

export function validateTickSpacing(tickSpacing: number): void {
  if (!Number.isInteger(tickSpacing) || tickSpacing <= 0) {
    throw new GSwapSDKError(
      'Invalid tick spacing: must be a positive integer',
      'VALIDATION_ERROR',
      {
        type: 'INVALID_TICK_SPACING',
        value: tickSpacing,
      },
    );
  }
}

export function validateWalletAddress(address?: string): asserts address is string {
  if (address === undefined) {
    throw new GSwapSDKError('No wallet address provided', 'VALIDATION_ERROR', {
      type: 'MISSING_WALLET_ADDRESS',
      hint: 'Either provide a wallet address to the function you are calling, or set one when instantiating GSwapSDK',
    });
  }

  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new GSwapSDKError(
      'Invalid wallet address: must be a non-empty string',
      'VALIDATION_ERROR',
      {
        type: 'INVALID_WALLET_ADDRESS',
        value: address,
      },
    );
  }
}
