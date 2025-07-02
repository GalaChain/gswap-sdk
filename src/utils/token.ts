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
