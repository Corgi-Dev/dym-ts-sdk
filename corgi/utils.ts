import { Secp256k1, sha256 } from '@cosmjs/crypto';
import { DirectSignResponse, makeSignBytes } from '@cosmjs/proto-signing';
import { StdSignature } from '@tendermint/sig';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { StdFee, StdSignDoc } from '@cosmjs/launchpad';
import { Secp256k1Pubkey } from './types';
import { pubkeyType } from './constants';

export async function signerSignDirect(
  signDoc: SignDoc,
  privKey: Uint8Array,
  pubKey: Uint8Array,
): Promise<DirectSignResponse> {
  const signBytes = makeSignBytes(signDoc);

  const hashedMessage = sha256(signBytes);
  const signature = await Secp256k1.createSignature(hashedMessage, privKey);
  const signatureBytes = new Uint8Array([
    ...signature.r(32),
    ...signature.s(32),
  ]);
  const stdSignature = encodeSecp256k1Signature(pubKey, signatureBytes);

  return {
    signed: signDoc,
    signature: stdSignature,
  };
}

export function encodeSecp256k1Signature(
  pubkey: Uint8Array,
  signature: Uint8Array,
): StdSignature {
  if (signature.length !== 64) {
    throw new Error(
      'Signature must be 64 bytes long. Cosmos SDK uses a 2x32 byte fixed length encoding for the secp256k1 signature integers r and s.',
    );
  }

  return {
    pub_key: encodeSecp256k1Pubkey(pubkey),
    signature: Buffer.from(signature).toString('base64'),
  };
}

export function encodeSecp256k1Pubkey(pubKey: Uint8Array): Secp256k1Pubkey {
  if (pubKey.length !== 33 || (pubKey[0] !== 0x02 && pubKey[0] !== 0x03)) {
    throw new Error(
      'Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03',
    );
  }

  return {
    type: pubkeyType.secp256k1,
    value: Buffer.from(pubKey).toString('base64'),
  };
}

export interface AminoMsg {
  readonly type: string;
  readonly value: any;
}

// eslint-disable-next-line max-params
export function makeSignDocAmino(
  msgs: readonly AminoMsg[],
  fee: StdFee,
  chainId: string,
  memo: string | undefined,
  accountNumber: number | string,
  sequence: number | string,
  timeoutHeight?: bigint,
): StdSignDoc {
  return {
    chain_id: chainId,
    account_number: accountNumber.toString(),
    sequence: sequence.toString(),
    fee,
    msgs,
    memo: memo || '',
    ...(timeoutHeight && { timeout_height: timeoutHeight.toString() }),
  };
}
