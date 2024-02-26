"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signerSignDirect = exports.EthSigningStargateClient = exports.createDefaultAminoConverters = void 0;
/* eslint-disable max-params */
const encoding_1 = require("@cosmjs/encoding");
const math_1 = require("@cosmjs/math");
const proto_signing_1 = require("@cosmjs/proto-signing");
const utils_1 = require("@cosmjs/utils");
const tx_1 = require("cosmjs-types/cosmos/distribution/v1beta1/tx");
const tx_2 = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const signing_1 = require("cosmjs-types/cosmos/tx/signing/v1beta1/signing");
const tx_3 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const tx_4 = require("cosmjs-types/ibc/applications/transfer/v1/tx");
const stargate_1 = require("@cosmjs/stargate");
const stargate_client_1 = require("./stargate-client");
const utils_2 = require("./utils");
// eslint-disable-next-line import/no-relative-packages
const build_1 = require("./tendermint-rpc/build");
const crypto_1 = require("@cosmjs/crypto");
const proto_signing_2 = require("@cosmjs/proto-signing");
const pubkeyType = {
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/ed25519/ed25519.go#L22 */
    secp256k1: "tendermint/PubKeySecp256k1",
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/secp256k1/secp256k1.go#L23 */
    ed25519: "tendermint/PubKeyEd25519",
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/sr25519/codec.go#L12 */
    sr25519: "tendermint/PubKeySr25519",
    multisigThreshold: "tendermint/PubKeyMultisigThreshold",
};
function createDefaultAminoConverters() {
    return {
        ...(0, stargate_1.createAuthzAminoConverters)(),
        ...(0, stargate_1.createBankAminoConverters)(),
        ...(0, stargate_1.createDistributionAminoConverters)(),
        ...(0, stargate_1.createGovAminoConverters)(),
        ...(0, stargate_1.createIbcAminoConverters)(),
    };
}
exports.createDefaultAminoConverters = createDefaultAminoConverters;
class EthSigningStargateClient extends stargate_client_1.EthStargateClient {
    registry;
    broadcastTimeoutMs;
    broadcastPollIntervalMs;
    signer;
    aminoTypes;
    gasPrice;
    /**
     * Creates an instance by connecting to the given Tendermint RPC endpoint.
     *
     * For now this uses the Tendermint 0.34 client. If you need Tendermint 0.37
     * support, see `createWithSigner`.
     */
    static async connectWithSigner(endpoint, signer, options = {}) {
        const tmClient = await build_1.Tendermint37Client.connect(endpoint);
        return EthSigningStargateClient.createWithSigner(tmClient, signer, options);
    }
    /**
     * Creates an instance from a manually created Tendermint client.
     * Use this to use `Tendermint37Client` instead of `Tendermint37Client`.
     */
    static async createWithSigner(tmClient, signer, options = {}) {
        return new EthSigningStargateClient(tmClient, signer, options);
    }
    /**
     * Creates a client in offline mode.
     *
     * This should only be used in niche cases where you know exactly what you're doing,
     * e.g. when building an offline signing application.
     *
     * When you try to use online functionality with such a signer, an
     * exception will be raised.
     */
    static async offline(signer, options = {}) {
        return new EthSigningStargateClient(undefined, signer, options);
    }
    constructor(tmClient, signer, options) {
        super(tmClient, options);
        const { registry = new proto_signing_1.Registry(stargate_1.defaultRegistryTypes), aminoTypes = new stargate_1.AminoTypes(createDefaultAminoConverters()), } = options;
        this.registry = registry;
        this.aminoTypes = aminoTypes;
        this.signer = signer;
        this.broadcastTimeoutMs = options.broadcastTimeoutMs;
        this.broadcastPollIntervalMs = options.broadcastPollIntervalMs;
        this.gasPrice = options.gasPrice;
    }
    async simulate(signerAddress, messages, memo) {
        const anyMsgs = messages.map((m) => this.registry.encodeAsAny(m));
        const accountFromSigner = (await this.signer.getAccounts()).find((account) => account.address === signerAddress);
        if (!accountFromSigner) {
            throw new Error("Failed to retrieve account from signer");
        }
        const pubkey = encodeSecp256k1Pubkey(accountFromSigner.pubkey);
        const { sequence } = await this.getSequence(signerAddress);
        const { gasInfo } = await this.forceGetQueryClient().tx.simulate(anyMsgs, memo, pubkey, sequence);
        (0, utils_1.assertDefined)(gasInfo);
        return math_1.Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
    }
    async sendTokens(senderAddress, recipientAddress, amount, fee, memo = "") {
        const sendMsg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: senderAddress,
                toAddress: recipientAddress,
                amount: [...amount],
            },
        };
        return this.signAndBroadcast(senderAddress, [sendMsg], fee, memo);
    }
    async delegateTokens(delegatorAddress, validatorAddress, amount, fee, memo = "") {
        const delegateMsg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: tx_2.MsgDelegate.fromPartial({
                delegatorAddress,
                validatorAddress,
                amount,
            }),
        };
        return this.signAndBroadcast(delegatorAddress, [delegateMsg], fee, memo);
    }
    async undelegateTokens(delegatorAddress, validatorAddress, amount, fee, memo = "") {
        const undelegateMsg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
            value: tx_2.MsgUndelegate.fromPartial({
                delegatorAddress,
                validatorAddress,
                amount,
            }),
        };
        return this.signAndBroadcast(delegatorAddress, [undelegateMsg], fee, memo);
    }
    async withdrawRewards(delegatorAddress, validatorAddress, fee, memo = "") {
        const withdrawMsg = {
            typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            value: tx_1.MsgWithdrawDelegatorReward.fromPartial({
                delegatorAddress,
                validatorAddress,
            }),
        };
        return this.signAndBroadcast(delegatorAddress, [withdrawMsg], fee, memo);
    }
    async sendIbcTokens(senderAddress, recipientAddress, transferAmount, sourcePort, sourceChannel, timeoutHeight, 
    /** timeout in seconds */
    timeoutTimestamp, fee, memo = "") {
        const timeoutTimestampNanoseconds = timeoutTimestamp
            ? // eslint-disable-next-line no-undef
                BigInt(timeoutTimestamp) * BigInt(1_000_000_000)
            : undefined;
        const transferMsg = {
            typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
            value: tx_4.MsgTransfer.fromPartial({
                sourcePort,
                sourceChannel,
                sender: senderAddress,
                receiver: recipientAddress,
                token: transferAmount,
                timeoutHeight,
                timeoutTimestamp: timeoutTimestampNanoseconds,
            }),
        };
        return this.signAndBroadcast(senderAddress, [transferMsg], fee, memo);
    }
    async signAndBroadcast(signerAddress, messages, fee, memo = "") {
        let usedFee;
        if (fee === "auto" || typeof fee === "number") {
            (0, utils_1.assertDefined)(this.gasPrice, "Gas price must be set in the client options when auto gas is used.");
            const gasEstimation = await this.simulate(signerAddress, messages, memo);
            const multiplier = typeof fee === "number" ? fee : 1.3;
            usedFee = (0, stargate_1.calculateFee)(Math.round(gasEstimation * multiplier), this.gasPrice);
        }
        else {
            usedFee = fee;
        }
        const txRaw = await this.sign(signerAddress, messages, usedFee, memo);
        const txBytes = tx_3.TxRaw.encode(txRaw).finish();
        return this.broadcastTx(txBytes, this.broadcastTimeoutMs, this.broadcastPollIntervalMs);
    }
    /**
     * Gets account number and sequence from the API, creates a sign doc,
     * creates a single signature and assembles the signed transaction.
     *
     * The sign mode (SIGN_MODE_DIRECT or SIGN_MODE_LEGACY_AMINO_JSON) is determined by this client's signer.
     *
     * You can pass signer data (account number, sequence and chain ID) explicitly instead of querying them
     * from the chain. This is needed when signing for a multisig account, but it also allows for offline signing
     * (See the SigningStargateClient.offline constructor).
     */
    async sign(signerAddress, messages, fee, memo, explicitSignerData) {
        let signerData;
        if (explicitSignerData) {
            signerData = explicitSignerData;
        }
        else {
            const { accountNumber, sequence } = await this.getSequence(signerAddress);
            const chainId = await this.getChainId();
            signerData = {
                accountNumber,
                sequence,
                chainId,
            };
        }
        return (0, proto_signing_1.isOfflineDirectSigner)(this.signer)
            ? this.signDirect(signerAddress, messages, fee, memo, signerData)
            : this.signAmino(signerAddress, messages, fee, memo, signerData);
    }
    async signAmino(signerAddress, messages, fee, memo, { accountNumber, sequence, chainId }) {
        (0, utils_1.assert)(!(0, proto_signing_1.isOfflineDirectSigner)(this.signer));
        const accountFromSigner = (await this.signer.getAccounts()).find((account) => account.address === signerAddress);
        if (!accountFromSigner) {
            throw new Error("Failed to retrieve account from signer");
        }
        const pubkey = (0, stargate_client_1.startWithChainIdPrefix)(chainId)
            ? (0, utils_2.getPublicKey)({
                chainId,
                key: Buffer.from(accountFromSigner.pubkey).toString("base64"),
            })
            : (0, proto_signing_1.encodePubkey)(encodeSecp256k1Pubkey(accountFromSigner.pubkey));
        const signMode = signing_1.SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
        const msgs = messages.map((msg) => this.aminoTypes.toAmino(msg));
        const signDoc = makeSignDocAmino(msgs, fee, chainId, memo, accountNumber, sequence);
        const { signature, signed } = await this.signer.signAmino(signerAddress, signDoc);
        const signedTxBody = {
            messages: signed.msgs.map((msg) => this.aminoTypes.fromAmino(msg)),
            memo: signed.memo,
        };
        const signedTxBodyEncodeObject = {
            typeUrl: "/cosmos.tx.v1beta1.TxBody",
            value: signedTxBody,
        };
        const signedTxBodyBytes = this.registry.encode(signedTxBodyEncodeObject);
        const signedGasLimit = math_1.Int53.fromString(signed.fee.gas).toNumber();
        const signedSequence = math_1.Int53.fromString(signed.sequence).toNumber();
        const signedAuthInfoBytes = (0, proto_signing_1.makeAuthInfoBytes)([{ pubkey, sequence: signedSequence }], signed.fee.amount, signedGasLimit, 127);
        return tx_3.TxRaw.fromPartial({
            bodyBytes: signedTxBodyBytes,
            authInfoBytes: signedAuthInfoBytes,
            signatures: [(0, encoding_1.fromBase64)(signature.signature)],
        });
    }
    async signDirect(signerAddress, messages, fee, memo, { accountNumber, sequence, chainId }) {
        (0, utils_1.assert)((0, proto_signing_1.isOfflineDirectSigner)(this.signer));
        const accountFromSigner = (await this.signer.getAccounts()).find((account) => account.address === signerAddress);
        if (!accountFromSigner) {
            throw new Error("Failed to retrieve account from signer");
        }
        const pubkey = (0, stargate_client_1.startWithChainIdPrefix)(chainId)
            ? (0, utils_2.getPublicKey)({
                chainId,
                key: Buffer.from(accountFromSigner.pubkey).toString("base64"),
            })
            : (0, proto_signing_1.encodePubkey)(encodeSecp256k1Pubkey(accountFromSigner.pubkey));
        const txBodyEncodeObject = {
            typeUrl: "/cosmos.tx.v1beta1.TxBody",
            value: {
                messages,
                memo,
            },
        };
        const txBodyBytes = this.registry.encode(txBodyEncodeObject);
        const gasLimit = math_1.Int53.fromString(fee.gas).toNumber();
        const authInfoBytes = (0, proto_signing_1.makeAuthInfoBytes)([{ pubkey, sequence }], fee.amount, gasLimit, 127);
        const signDoc = (0, proto_signing_1.makeSignDoc)(txBodyBytes, authInfoBytes, chainId, accountNumber);
        const { signature, signed } = await this.signer.signDirect(signerAddress, signDoc);
        return tx_3.TxRaw.fromPartial({
            bodyBytes: signed.bodyBytes,
            authInfoBytes: signed.authInfoBytes,
            signatures: [(0, encoding_1.fromBase64)(signature.signature)],
        });
    }
}
exports.EthSigningStargateClient = EthSigningStargateClient;
async function signerSignDirect(signDoc, privKey, pubKey) {
    const signBytes = (0, proto_signing_2.makeSignBytes)(signDoc);
    const hashedMessage = (0, crypto_1.sha256)(signBytes);
    const signature = await crypto_1.Secp256k1.createSignature(hashedMessage, privKey);
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
exports.signerSignDirect = signerSignDirect;
function encodeSecp256k1Signature(pubkey, signature) {
    if (signature.length !== 64) {
        throw new Error("Signature must be 64 bytes long. Cosmos SDK uses a 2x32 byte fixed length encoding for the secp256k1 signature integers r and s.");
    }
    return {
        pub_key: encodeSecp256k1Pubkey(pubkey),
        signature: Buffer.from(signature).toString("base64"),
    };
}
function encodeSecp256k1Pubkey(pubKey) {
    if (pubKey.length !== 33 || (pubKey[0] !== 0x02 && pubKey[0] !== 0x03)) {
        throw new Error("Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03");
    }
    return {
        type: pubkeyType.secp256k1,
        value: Buffer.from(pubKey).toString("base64"),
    };
}
// eslint-disable-next-line max-params
function makeSignDocAmino(msgs, fee, chainId, memo, accountNumber, sequence, timeoutHeight) {
    return {
        chain_id: chainId,
        account_number: accountNumber.toString(),
        sequence: sequence.toString(),
        fee,
        msgs,
        memo: memo || "",
        ...(timeoutHeight && { timeout_height: timeoutHeight.toString() }),
    };
}
//# sourceMappingURL=index.js.map