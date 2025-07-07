import { GSwapSDKError } from '../classes/gswap_sdk_error.js';
import { GalaChainTokenClassKey } from '../types/token.js';

export function stringifyTokenClassKey(
  tokenClassKey: GalaChainTokenClassKey | string,
  separator = '|',
): string {
  if (typeof tokenClassKey === 'string') {
    return tokenClassKey;
  }

  return `${tokenClassKey.collection}${separator}${tokenClassKey.category}${separator}${tokenClassKey.type}${separator}${tokenClassKey.additionalKey}`;
}

export function parseTokenClassKey(
  tokenClassKey: string | GalaChainTokenClassKey,
): GalaChainTokenClassKey {
  if (typeof tokenClassKey === 'object') {
    return {
      collection: tokenClassKey.collection,
      category: tokenClassKey.category,
      type: tokenClassKey.type,
      additionalKey: tokenClassKey.additionalKey,
    };
  }

  const [collection, category, type, additionalKey] = tokenClassKey.split('|');

  if (!collection || !category || !type || !additionalKey) {
    throw new GSwapSDKError(`Invalid token class key`, 'INVALID_TOKEN_CLASS_KEY', {
      tokenClassKey,
    });
  }

  return {
    collection,
    category,
    type,
    additionalKey,
  };
}

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
