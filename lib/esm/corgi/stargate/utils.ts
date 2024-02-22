import { ChainId, EthereumChainId } from '@injectivelabs/ts-types';
import {
  GoogleProtobufAny,
  CosmosTxV1Beta1Tx,
  CosmosBaseV1Beta1Coin,
  InjectiveTypesV1TxExt,
  CosmosCryptoSecp256k1Keys,
  CosmosTxSigningV1Beta1Signing,
  InjectiveTypesV1Beta1Account,
} from '@injectivelabs/core-proto-ts';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { getStdFee } from '@injectivelabs/utils';

import { Account } from '@cosmjs/stargate';

import { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth';

export const createAnyMessage = (msg: { type: string; value: Uint8Array }) => {
  const message = GoogleProtobufAny.Any.create();

  message.typeUrl = `${msg.type.startsWith('/') ? '' : '/'}${msg.type}`;
  message.value = msg.value;

  return message;
};

export const createAny = (value: any, type: string) => {
  const message = GoogleProtobufAny.Any.create();

  message.typeUrl = type;
  message.value = value;

  return message;
};

export const getPublicKey = ({
  chainId,
  key,
}: {
  chainId: string;
  key: string | GoogleProtobufAny.Any;
}) => {
  if (typeof key !== 'string') {
    return key;
  }

  let proto;
  let path;
  let baseProto;

  if (chainId.startsWith('injective')) {
    proto = CosmosCryptoSecp256k1Keys.PubKey.create();
    baseProto = CosmosCryptoSecp256k1Keys.PubKey;
    path = '/injective.crypto.v1beta1.ethsecp256k1.PubKey';
  } else if (chainId.startsWith('dym')) {
    proto = CosmosCryptoSecp256k1Keys.PubKey.create();
    baseProto = CosmosCryptoSecp256k1Keys.PubKey;
    path = '/ethermint.crypto.v1.ethsecp256k1.PubKey';
  } else if (chainId.startsWith('evmos')) {
    proto = CosmosCryptoSecp256k1Keys.PubKey.create();
    baseProto = CosmosCryptoSecp256k1Keys.PubKey;
    path = '/ethermint.crypto.v1.ethsecp256k1.PubKey';
  } else {
    proto = CosmosCryptoSecp256k1Keys.PubKey.create();
    baseProto = CosmosCryptoSecp256k1Keys.PubKey;
    path = '/cosmos.crypto.secp256k1.PubKey';
  }

  proto.key = Buffer.from(key, 'base64');

  return createAny(baseProto.encode(proto).finish(), path);
};

export const createBody = ({
  message,
  memo = '',
  timeoutHeight,
}: {
  message: any;
  memo?: string;
  timeoutHeight?: number;
}) => {
  const messages = Array.isArray(message) ? message : [message];

  const txBody = CosmosTxV1Beta1Tx.TxBody.create();

  txBody.messages = messages.map((msg: any) =>
    createAnyMessage({
      value: msg.toBinary(),
      type: msg.toDirectSign().type,
    }));

  txBody.memo = memo;

  if (timeoutHeight) {
    txBody.timeoutHeight = timeoutHeight.toString();
  }

  return txBody;
};

export const createFee = ({
  fee,
  payer,
  granter,
  gasLimit,
}: {
  fee: { amount: string; denom: string };
  payer?: string;
  granter?: string;
  gasLimit: number;
}) => {
  const feeAmount = CosmosBaseV1Beta1Coin.Coin.create();

  feeAmount.amount = fee.amount;
  feeAmount.denom = fee.denom;

  const feeProto = CosmosTxV1Beta1Tx.Fee.create();

  feeProto.gasLimit = gasLimit.toString();
  feeProto.amount = [feeAmount];

  if (payer) {
    feeProto.payer = payer;
  }

  if (granter) {
    feeProto.granter = granter;
  }

  return feeProto;
};

export const createSigners = ({
  chainId,
  mode,
  signers,
}: {
  chainId: string;
  signers: { pubKey: string | GoogleProtobufAny.Any; sequence: number }[];
  mode: CosmosTxSigningV1Beta1Signing.SignMode;
}) =>
  signers.map((s) =>
    createSignerInfo({
      mode,
      chainId,
      publicKey: s.pubKey,
      sequence: s.sequence,
    }));

export const createSignerInfo = ({
  chainId,
  publicKey,
  sequence,
  mode,
}: {
  chainId: string;
  publicKey: string | GoogleProtobufAny.Any;
  sequence: number;
  mode: CosmosTxSigningV1Beta1Signing.SignMode;
}) => {
  const pubKey = getPublicKey({ chainId, key: publicKey });

  const single = CosmosTxV1Beta1Tx.ModeInfo_Single.create();

  single.mode = mode;

  const modeInfo = CosmosTxV1Beta1Tx.ModeInfo.create();

  modeInfo.single = single;

  const signerInfo = CosmosTxV1Beta1Tx.SignerInfo.create();

  signerInfo.publicKey = pubKey;
  signerInfo.sequence = sequence.toString();
  signerInfo.modeInfo = modeInfo;

  return signerInfo;
};

export const createAuthInfo = ({
  signerInfo,
  fee,
}: {
  signerInfo: CosmosTxV1Beta1Tx.SignerInfo[];
  fee: CosmosTxV1Beta1Tx.Fee;
}) => {
  const authInfo = CosmosTxV1Beta1Tx.AuthInfo.create();

  authInfo.signerInfos = signerInfo;
  authInfo.fee = fee;

  return authInfo;
};

export const createSignDoc = ({
  bodyBytes,
  authInfoBytes,
  chainId,
  accountNumber,
}: {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  chainId: string;
  accountNumber: number;
}) => {
  const signDoc = CosmosTxV1Beta1Tx.SignDoc.create();

  signDoc.accountNumber = accountNumber.toString();
  signDoc.chainId = chainId;
  signDoc.bodyBytes = bodyBytes;
  signDoc.authInfoBytes = authInfoBytes;

  return signDoc;
};

export const createSignDocFromTransaction = (args: {
  txRaw: CosmosTxV1Beta1Tx.TxRaw;
  chainId: string;
  accountNumber: number;
}) =>
  CosmosTxV1Beta1Tx.SignDoc.fromPartial({
    bodyBytes: args.txRaw.bodyBytes,
    authInfoBytes: args.txRaw.authInfoBytes,
    accountNumber: args.accountNumber.toString(),
    chainId: args.chainId,
  });

export const createCosmosSignDocFromSignDoc = (
  signDoc: CosmosTxV1Beta1Tx.SignDoc,
): SignDoc =>
  SignDoc.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    // eslint-disable-next-line no-undef
    accountNumber: BigInt(signDoc.accountNumber) as any,
    chainId: signDoc.chainId,
  });

export const createTxRawEIP712 = (
  txRaw: CosmosTxV1Beta1Tx.TxRaw,
  extension: InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx,
) => {
  const body = CosmosTxV1Beta1Tx.TxBody.decode(txRaw.bodyBytes);
  const extensionAny = createAny(
    InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx.encode(extension).finish(),
    '/injective.types.v1beta1.ExtensionOptionsWeb3Tx',
  );

  body.extensionOptions = [extensionAny];

  txRaw.bodyBytes = CosmosTxV1Beta1Tx.TxBody.encode(body).finish();

  return txRaw;
};

export const createWeb3Extension = ({
  ethereumChainId,
  feePayer,
  feePayerSig,
}: {
  ethereumChainId: EthereumChainId;
  feePayer?: string;
  feePayerSig?: Uint8Array;
}) => {
  const web3Extension = InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx.create();

  web3Extension.typedDataChainID = ethereumChainId.toString();

  if (feePayer) {
    web3Extension.feePayer = feePayer;
  }

  if (feePayerSig) {
    web3Extension.feePayerSig = feePayerSig;
  }

  return web3Extension;
};

export const getTransactionPartsFromTxRaw = (
  txRaw: CosmosTxV1Beta1Tx.TxRaw,
): {
  authInfo: CosmosTxV1Beta1Tx.AuthInfo;
  body: CosmosTxV1Beta1Tx.TxBody;
  signatures: Uint8Array[];
} => {
  const authInfo = CosmosTxV1Beta1Tx.AuthInfo.decode(txRaw.authInfoBytes);
  const body = CosmosTxV1Beta1Tx.TxBody.decode(txRaw.bodyBytes);

  return {
    body,
    authInfo,
    signatures: txRaw.signatures,
  };
};

export const getAminoStdSignDoc = ({
  memo,
  chainId,
  accountNumber,
  timeoutHeight,
  sequence,
  gas,
  msgs,
}: {
  memo?: string;
  chainId: ChainId;
  timeoutHeight?: string;
  accountNumber: number;
  sequence: number;
  gas?: string;
  msgs: any[];
}) => ({
  chain_id: chainId,
  timeout_height: timeoutHeight || '',
  account_number: accountNumber.toString(),
  sequence: sequence.toString(),
  fee: getStdFee({ gas }),
  msgs: msgs.map((m) => m.toAmino()),
  memo: memo || '',
});

export const accountParser = (ethAccount: any): Account => {
  let account: any;
  let pubkey: any;
  let address: string = '';
  let accountNumber: any = 0;
  let sequence: any = 0;

  if (ethAccount.typeUrl === '/cosmos.auth.v1beta1.BaseAccount') {
    account = BaseAccount.decode(ethAccount.value);
    address = account.address;
    pubkey = account.pubKey;
    sequence = Number(account.sequence);
    accountNumber = Number(account.accountNumber);
  } else {
    console.log('eth base');
    account = InjectiveTypesV1Beta1Account.EthAccount.decode(ethAccount.value);
    const { baseAccount } = account;

    address = baseAccount.address;
    pubkey = baseAccount.pubKey;
    sequence = Number(baseAccount.sequence);
    accountNumber = Number(baseAccount.accountNumber);
  }

  return {
    address,
    pubkey: pubkey
      ? {
        type: '/ethermint.crypto.v1.ethsecp256k1.PubKey',
        value: Buffer.from(pubkey.value).toString('base64'),
      }
      : null,
    accountNumber: parseInt(accountNumber, 10),
    sequence: parseInt(sequence, 10),
  };
};
