// import { AminoSignResponse, serializeSignDoc, StdSignDoc } from '@cosmjs/amino';
import {
  AminoSignResponse,
  Secp256k1Wallet,
  StdSignDoc,
} from '@cosmjs/launchpad';
import { toUtf8 } from '@cosmjs/encoding';
import { PublicKey } from './public-key';
import { PrivateKey } from './private-key';

export class EthSecp256k1Wallet {
  /**
   * Creates a EthSecp256k1Wallet from the given private key
   *
   * @param privKey The private key.
   * @param prefix The bech32 address prefix (human readable part)
   */
  public static async fromKey(
    privKey: Uint8Array,
    prefix = 'dym',
  ): Promise<Secp256k1Wallet> {
    const publicKey = PrivateKey.fromHex(Buffer.from(privKey).toString('hex'))
      .toPublicKey()
      .toPubKeyBytes();

    return new EthSecp256k1Wallet(
      privKey,
      publicKey,
      prefix,
    ) as unknown as Secp256k1Wallet;
  }

  private readonly privkey: Uint8Array;

  private readonly pubkey: Uint8Array;

  private readonly prefix: string;

  private constructor(privKey: Uint8Array, pubKey: Uint8Array, prefix: string) {
    this.privkey = privKey;
    this.pubkey = pubKey;
    this.prefix = prefix;
  }

  private get address(): string {
    return PublicKey.fromBytes(this.pubkey).toAddress().toBech32(this.prefix);
  }

  public getAccounts() {
    return [
      {
        algo: 'eth_secp256k1',
        address: this.address,
        pubkey: this.pubkey,
      },
    ];
  }

  public async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc,
  ): Promise<AminoSignResponse> {
    if (signerAddress !== this.address) {
      throw new Error(`Address ${signerAddress} not found in wallet`);
    }

    const messageBytes = serializeSignDoc(signDoc);
    const signature = await PrivateKey.fromHex(Buffer.from(this.privkey)).sign(
      Buffer.from(messageBytes),
    );

    return {
      signed: signDoc,
      signature: {
        pub_key: {
          type: 'tendermint/PubKeyEthSecp256k1',
          value: PublicKey.fromBytes(this.pubkey).toBase64(),
        },
        signature: Buffer.from(signature).toString('base64'),
      },
    };
  }
}

export function escapeCharacters(input: string): string {
  // When we migrate to target es2021 or above, we can use replaceAll instead of global patterns.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll
  const amp = /&/g;
  const lt = /</g;
  const gt = />/g;

  return input
    .replace(amp, '\\u0026')
    .replace(lt, '\\u003c')
    .replace(gt, '\\u003e');
}

export function serializeSignDoc(signDoc: StdSignDoc): Uint8Array {
  const serialized = escapeCharacters(sortedJsonStringify(signDoc));

  return toUtf8(serialized);
}

function sortedObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortedObject);
  }

  const sortedKeys = Object.keys(obj).sort();
  const result: Record<string, any> = {};

  // NOTE: Use forEach instead of reduce for performance with large objects eg Wasm code
  sortedKeys.forEach((key) => {
    result[key] = sortedObject(obj[key]);
  });

  return result;
}

/** Returns a JSON string with objects sorted by key */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function sortedJsonStringify(obj: any): string {
  return JSON.stringify(sortedObject(obj));
}
