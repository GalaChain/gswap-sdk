import { GSwapSDKError } from '../classes/gswap_sdk_error.js';
import { GalaChainTokenClassKey } from '../types/token.js';
import { stringifyTokenClassKey } from './token.js';

export function compareTokens(
  first: GalaChainTokenClassKey | string,
  second: GalaChainTokenClassKey | string,
) {
  return stringifyTokenClassKey(first).localeCompare(stringifyTokenClassKey(second));
}

export function getTokenOrdering<TAttributesType = undefined>(
  first: GalaChainTokenClassKey | string,
  second: GalaChainTokenClassKey | string,
  assertCorrectness: boolean,
  token1Data?: TAttributesType,
  token2Data?: TAttributesType,
) {
  const zeroForOne = compareTokens(first, second) < 0;

  if (zeroForOne) {
    return {
      token0: first,
      token1: second,
      zeroForOne,
      token0Attributes: token1Data,
      token1Attributes: token2Data,
    };
  } else {
    if (assertCorrectness) {
      throw GSwapSDKError.incorrectTokenOrderingError(first, second);
    }

    return {
      token0: second,
      token1: first,
      zeroForOne,
      token0Attributes: token2Data,
      token1Attributes: token1Data,
    };
  }
}
