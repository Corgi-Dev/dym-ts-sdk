import { ChainId, EthereumChainId } from '@injectivelabs/ts-types';
import { GoogleProtobufAny, CosmosTxV1Beta1Tx, InjectiveTypesV1TxExt, CosmosTxSigningV1Beta1Signing } from '@injectivelabs/core-proto-ts';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { Account } from '@cosmjs/stargate';
export declare const createAnyMessage: (msg: {
    type: string;
    value: Uint8Array;
}) => GoogleProtobufAny.Any;
export declare const createAny: (value: any, type: string) => GoogleProtobufAny.Any;
export declare const getPublicKey: ({ chainId, key, }: {
    chainId: string;
    key: string | GoogleProtobufAny.Any;
}) => GoogleProtobufAny.Any;
export declare const createBody: ({ message, memo, timeoutHeight, }: {
    message: any;
    memo?: string | undefined;
    timeoutHeight?: number | undefined;
}) => CosmosTxV1Beta1Tx.TxBody;
export declare const createFee: ({ fee, payer, granter, gasLimit, }: {
    fee: {
        amount: string;
        denom: string;
    };
    payer?: string | undefined;
    granter?: string | undefined;
    gasLimit: number;
}) => CosmosTxV1Beta1Tx.Fee;
export declare const createSigners: ({ chainId, mode, signers, }: {
    chainId: string;
    signers: {
        pubKey: string | GoogleProtobufAny.Any;
        sequence: number;
    }[];
    mode: CosmosTxSigningV1Beta1Signing.SignMode;
}) => CosmosTxV1Beta1Tx.SignerInfo[];
export declare const createSignerInfo: ({ chainId, publicKey, sequence, mode, }: {
    chainId: string;
    publicKey: string | GoogleProtobufAny.Any;
    sequence: number;
    mode: CosmosTxSigningV1Beta1Signing.SignMode;
}) => CosmosTxV1Beta1Tx.SignerInfo;
export declare const createAuthInfo: ({ signerInfo, fee, }: {
    signerInfo: CosmosTxV1Beta1Tx.SignerInfo[];
    fee: CosmosTxV1Beta1Tx.Fee;
}) => CosmosTxV1Beta1Tx.AuthInfo;
export declare const createSignDoc: ({ bodyBytes, authInfoBytes, chainId, accountNumber, }: {
    bodyBytes: Uint8Array;
    authInfoBytes: Uint8Array;
    chainId: string;
    accountNumber: number;
}) => CosmosTxV1Beta1Tx.SignDoc;
export declare const createSignDocFromTransaction: (args: {
    txRaw: CosmosTxV1Beta1Tx.TxRaw;
    chainId: string;
    accountNumber: number;
}) => CosmosTxV1Beta1Tx.SignDoc;
export declare const createCosmosSignDocFromSignDoc: (signDoc: CosmosTxV1Beta1Tx.SignDoc) => SignDoc;
export declare const createTxRawEIP712: (txRaw: CosmosTxV1Beta1Tx.TxRaw, extension: InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx) => CosmosTxV1Beta1Tx.TxRaw;
export declare const createWeb3Extension: ({ ethereumChainId, feePayer, feePayerSig, }: {
    ethereumChainId: EthereumChainId;
    feePayer?: string | undefined;
    feePayerSig?: Uint8Array | undefined;
}) => InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx;
export declare const getTransactionPartsFromTxRaw: (txRaw: CosmosTxV1Beta1Tx.TxRaw) => {
    authInfo: CosmosTxV1Beta1Tx.AuthInfo;
    body: CosmosTxV1Beta1Tx.TxBody;
    signatures: Uint8Array[];
};
export declare const getAminoStdSignDoc: ({ memo, chainId, accountNumber, timeoutHeight, sequence, gas, msgs, }: {
    memo?: string | undefined;
    chainId: ChainId;
    timeoutHeight?: string | undefined;
    accountNumber: number;
    sequence: number;
    gas?: string | undefined;
    msgs: any[];
}) => {
    chain_id: ChainId;
    timeout_height: string;
    account_number: string;
    sequence: string;
    fee: {
        amount: {
            denom: string;
            amount: string;
        }[];
        gas: string;
        payer: string | undefined;
        granter: string | undefined;
        feePayer: string | undefined;
    };
    msgs: any[];
    memo: string;
};
export declare const accountParser: (ethAccount: any) => Account;
