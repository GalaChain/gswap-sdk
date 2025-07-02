import { signatures } from '@gala-chain/api';
import { calculatePersonalSignPrefix } from '@gala-chain/connect';
import { GSwapSDKError } from './gswap_sdk_error.js';

type EIP712Types = Record<string, Array<{ name: string; type: string }>>;

/**
 * A transaction signing interface. See {@link PrivateKeySigner} and {@link GalaWalletSigner} for implementations.
 */
export interface GalaChainSigner {
  signObject: <TObjectType extends Record<string, unknown>>(
    methodName: string,
    object: TObjectType,
  ) => Promise<TObjectType & { signature: string }>;
}

/**
 * A signing implementation that uses a private key string to sign requests.
 */
export class PrivateKeySigner implements GalaChainSigner {
  private readonly keyBuffer: Buffer;

  constructor(privateKey: string) {
    this.keyBuffer = signatures.normalizePrivateKey(privateKey);
  }

  public async signObject<TObjectType extends Record<string, unknown>>(
    _methodName: string,
    obj: TObjectType,
  ): Promise<TObjectType & { signature: string }> {
    const signature = signatures.getSignature(obj, this.keyBuffer);
    return { ...obj, signature };
  }
}

/**
 * A signing implementation that uses Gala Wallet to sign requests.
 */
export class GalaWalletSigner implements GalaChainSigner {
  constructor(public readonly walletAddress: string) {}

  public async signObject<TObjectType extends Record<string, unknown>>(
    methodName: string,
    obj: TObjectType,
  ): Promise<TObjectType & { signature: string }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalGala = (global as any).gala;

    if (!globalGala) {
      throw new GSwapSDKError(
        'Gala wallet is not available. Please ensure the Gala wallet is connected.',
        'GALA_WALLET_NOT_AVAILABLE',
      );
    }

    const domain = { name: 'ethereum', chainId: 1 };
    const types = GalaWalletSigner.generateEIP712Types(methodName, obj);

    const signRequest = {
      domain,
      types,
      Primary_type: methodName,
      message: {
        ...obj,
        prefix: calculatePersonalSignPrefix(obj),
      },
    };

    await globalGala.setAddress(this.walletAddress);
    const signature = await globalGala.request({
      method: 'eth_signTypedData',
      params: [JSON.stringify(signRequest), this.walletAddress],
    });

    return { ...obj, domain, types, signature } as unknown as TObjectType & {
      signature: string;
    };
  }

  private static generateEIP712Types<T>(typeName: string, params: T): EIP712Types {
    const types: EIP712Types = {};
    types[typeName] = [];

    function addField(
      name: string,
      fieldValue: unknown,
      parentTypeName: string,
      onlyGetType = false,
    ) {
      if (fieldValue === undefined) {
        // NOOP
      } else if (Array.isArray(fieldValue)) {
        //Take the type of the first element
        const type = addField(name, fieldValue[0], parentTypeName, true);
        if (!onlyGetType) types[parentTypeName]!.push({ name, type: (type ?? name) + '[]' });
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        if (types[name]) {
          throw new GSwapSDKError(
            'Name collisions not yet supported in EIP712 type generation',
            'EIP712_NAME_COLLISION',
            { name },
          );
        }
        types[name] = [];
        Object.entries(fieldValue).forEach(([key, value]) => {
          addField(key, value, name);
        });
        if (!onlyGetType) types[parentTypeName]!.push({ name, type: name });
      } else {
        let eipType: string;
        switch (typeof fieldValue) {
          case 'string':
            eipType = 'string';
            break;
          case 'number':
            eipType = 'int256';
            break;
          case 'boolean':
            eipType = 'bool';
            break;
          default:
            throw new GSwapSDKError(
              `Unsupported type for EIP712 signing: ${typeof fieldValue}`,
              'EIP712_UNSUPPORTED_TYPE',
              { type: typeof fieldValue, value: fieldValue },
            );
        }
        if (onlyGetType) {
          return eipType;
        } else {
          types[parentTypeName]!.push({ name, type: eipType });
        }
      }
    }

    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      addField(key, value, typeName);
    });

    return types;
  }
}
