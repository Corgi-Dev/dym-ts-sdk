"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountParser = exports.getAminoStdSignDoc = exports.getTransactionPartsFromTxRaw = exports.createWeb3Extension = exports.createTxRawEIP712 = exports.createCosmosSignDocFromSignDoc = exports.createSignDocFromTransaction = exports.createSignDoc = exports.createAuthInfo = exports.createSignerInfo = exports.createSigners = exports.createFee = exports.createBody = exports.getPublicKey = exports.createAny = exports.createAnyMessage = void 0;
const core_proto_ts_1 = require("@injectivelabs/core-proto-ts");
const tx_1 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const utils_1 = require("@injectivelabs/utils");
const auth_1 = require("cosmjs-types/cosmos/auth/v1beta1/auth");
const createAnyMessage = (msg) => {
    const message = core_proto_ts_1.GoogleProtobufAny.Any.create();
    message.typeUrl = `${msg.type.startsWith('/') ? '' : '/'}${msg.type}`;
    message.value = msg.value;
    return message;
};
exports.createAnyMessage = createAnyMessage;
const createAny = (value, type) => {
    const message = core_proto_ts_1.GoogleProtobufAny.Any.create();
    message.typeUrl = type;
    message.value = value;
    return message;
};
exports.createAny = createAny;
const getPublicKey = ({ chainId, key, }) => {
    if (typeof key !== 'string') {
        return key;
    }
    let proto;
    let path;
    let baseProto;
    if (chainId.startsWith('injective')) {
        proto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey.create();
        baseProto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey;
        path = '/injective.crypto.v1beta1.ethsecp256k1.PubKey';
    }
    else if (chainId.startsWith('dym')) {
        proto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey.create();
        baseProto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey;
        path = '/ethermint.crypto.v1.ethsecp256k1.PubKey';
    }
    else if (chainId.startsWith('evmos')) {
        proto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey.create();
        baseProto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey;
        path = '/ethermint.crypto.v1.ethsecp256k1.PubKey';
    }
    else {
        proto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey.create();
        baseProto = core_proto_ts_1.CosmosCryptoSecp256k1Keys.PubKey;
        path = '/cosmos.crypto.secp256k1.PubKey';
    }
    proto.key = Buffer.from(key, 'base64');
    return (0, exports.createAny)(baseProto.encode(proto).finish(), path);
};
exports.getPublicKey = getPublicKey;
const createBody = ({ message, memo = '', timeoutHeight, }) => {
    const messages = Array.isArray(message) ? message : [message];
    const txBody = core_proto_ts_1.CosmosTxV1Beta1Tx.TxBody.create();
    txBody.messages = messages.map((msg) => (0, exports.createAnyMessage)({
        value: msg.toBinary(),
        type: msg.toDirectSign().type,
    }));
    txBody.memo = memo;
    if (timeoutHeight) {
        txBody.timeoutHeight = timeoutHeight.toString();
    }
    return txBody;
};
exports.createBody = createBody;
const createFee = ({ fee, payer, granter, gasLimit, }) => {
    const feeAmount = core_proto_ts_1.CosmosBaseV1Beta1Coin.Coin.create();
    feeAmount.amount = fee.amount;
    feeAmount.denom = fee.denom;
    const feeProto = core_proto_ts_1.CosmosTxV1Beta1Tx.Fee.create();
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
exports.createFee = createFee;
const createSigners = ({ chainId, mode, signers, }) => signers.map((s) => (0, exports.createSignerInfo)({
    mode,
    chainId,
    publicKey: s.pubKey,
    sequence: s.sequence,
}));
exports.createSigners = createSigners;
const createSignerInfo = ({ chainId, publicKey, sequence, mode, }) => {
    const pubKey = (0, exports.getPublicKey)({ chainId, key: publicKey });
    const single = core_proto_ts_1.CosmosTxV1Beta1Tx.ModeInfo_Single.create();
    single.mode = mode;
    const modeInfo = core_proto_ts_1.CosmosTxV1Beta1Tx.ModeInfo.create();
    modeInfo.single = single;
    const signerInfo = core_proto_ts_1.CosmosTxV1Beta1Tx.SignerInfo.create();
    signerInfo.publicKey = pubKey;
    signerInfo.sequence = sequence.toString();
    signerInfo.modeInfo = modeInfo;
    return signerInfo;
};
exports.createSignerInfo = createSignerInfo;
const createAuthInfo = ({ signerInfo, fee, }) => {
    const authInfo = core_proto_ts_1.CosmosTxV1Beta1Tx.AuthInfo.create();
    authInfo.signerInfos = signerInfo;
    authInfo.fee = fee;
    return authInfo;
};
exports.createAuthInfo = createAuthInfo;
const createSignDoc = ({ bodyBytes, authInfoBytes, chainId, accountNumber, }) => {
    const signDoc = core_proto_ts_1.CosmosTxV1Beta1Tx.SignDoc.create();
    signDoc.accountNumber = accountNumber.toString();
    signDoc.chainId = chainId;
    signDoc.bodyBytes = bodyBytes;
    signDoc.authInfoBytes = authInfoBytes;
    return signDoc;
};
exports.createSignDoc = createSignDoc;
const createSignDocFromTransaction = (args) => core_proto_ts_1.CosmosTxV1Beta1Tx.SignDoc.fromPartial({
    bodyBytes: args.txRaw.bodyBytes,
    authInfoBytes: args.txRaw.authInfoBytes,
    accountNumber: args.accountNumber.toString(),
    chainId: args.chainId,
});
exports.createSignDocFromTransaction = createSignDocFromTransaction;
const createCosmosSignDocFromSignDoc = (signDoc) => tx_1.SignDoc.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    accountNumber: BigInt(signDoc.accountNumber),
    chainId: signDoc.chainId,
});
exports.createCosmosSignDocFromSignDoc = createCosmosSignDocFromSignDoc;
const createTxRawEIP712 = (txRaw, extension) => {
    const body = core_proto_ts_1.CosmosTxV1Beta1Tx.TxBody.decode(txRaw.bodyBytes);
    const extensionAny = (0, exports.createAny)(core_proto_ts_1.InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx.encode(extension).finish(), '/injective.types.v1beta1.ExtensionOptionsWeb3Tx');
    body.extensionOptions = [extensionAny];
    txRaw.bodyBytes = core_proto_ts_1.CosmosTxV1Beta1Tx.TxBody.encode(body).finish();
    return txRaw;
};
exports.createTxRawEIP712 = createTxRawEIP712;
const createWeb3Extension = ({ ethereumChainId, feePayer, feePayerSig, }) => {
    const web3Extension = core_proto_ts_1.InjectiveTypesV1TxExt.ExtensionOptionsWeb3Tx.create();
    web3Extension.typedDataChainID = ethereumChainId.toString();
    if (feePayer) {
        web3Extension.feePayer = feePayer;
    }
    if (feePayerSig) {
        web3Extension.feePayerSig = feePayerSig;
    }
    return web3Extension;
};
exports.createWeb3Extension = createWeb3Extension;
const getTransactionPartsFromTxRaw = (txRaw) => {
    const authInfo = core_proto_ts_1.CosmosTxV1Beta1Tx.AuthInfo.decode(txRaw.authInfoBytes);
    const body = core_proto_ts_1.CosmosTxV1Beta1Tx.TxBody.decode(txRaw.bodyBytes);
    return {
        body,
        authInfo,
        signatures: txRaw.signatures,
    };
};
exports.getTransactionPartsFromTxRaw = getTransactionPartsFromTxRaw;
const getAminoStdSignDoc = ({ memo, chainId, accountNumber, timeoutHeight, sequence, gas, msgs, }) => ({
    chain_id: chainId,
    timeout_height: timeoutHeight || '',
    account_number: accountNumber.toString(),
    sequence: sequence.toString(),
    fee: (0, utils_1.getStdFee)({ gas }),
    msgs: msgs.map((m) => m.toAmino()),
    memo: memo || '',
});
exports.getAminoStdSignDoc = getAminoStdSignDoc;
const accountParser = (ethAccount) => {
    let account;
    let pubkey;
    let address = '';
    let accountNumber = 0;
    let sequence = 0;
    if (ethAccount.typeUrl === '/cosmos.auth.v1beta1.BaseAccount') {
        account = auth_1.BaseAccount.decode(ethAccount.value);
        address = account.address;
        pubkey = account.pubKey;
        sequence = Number(account.sequence);
        accountNumber = Number(account.accountNumber);
    }
    else {
        console.log('eth base');
        account = core_proto_ts_1.InjectiveTypesV1Beta1Account.EthAccount.decode(ethAccount.value);
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
exports.accountParser = accountParser;
//# sourceMappingURL=utils.js.map