"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateKey = exports.DEFAULT_DERIVATION_PATH = void 0;
const bip39_1 = __importDefault(require("bip39"));
const ethers_1 = require("ethers");
const secp256k1_1 = __importDefault(require("secp256k1"));
const keccak256_1 = __importDefault(require("keccak256"));
const BytesUtils = __importStar(require("@ethersproject/bytes"));
const eth_sig_util_1 = require("@metamask/eth-sig-util");
const public_key_1 = require("./public-key");
const address_1 = require("./address");
exports.DEFAULT_DERIVATION_PATH = "m/44'/60'/0'/0/0";
/**
 * Class for wrapping SigningKey that is used for signature creation and public key derivation.
 *
 * @category Crypto Utility Classes
 */
class PrivateKey {
    wallet;
    constructor(wallet) {
        this.wallet = wallet;
    }
    /**
     * Generate new private key with random mnemonic phrase
     * @returns { privateKey: PrivateKey, mnemonic: string }
     */
    static generate() {
        const mnemonic = bip39_1.default.generateMnemonic();
        const privateKey = PrivateKey.fromMnemonic(mnemonic);
        return {
            privateKey,
            mnemonic,
        };
    }
    /**
     * Create a PrivateKey instance from a given mnemonic phrase and a HD derivation path.
     * If path is not given, default to Band's HD prefix 494 and all other indexes being zeroes.
     * @param {string} words the mnemonic phrase
     * @param {string|undefined} path the HD path that follows the BIP32 standard (optional)
     * @returns {PrivateKey} Initialized PrivateKey object
     */
    static fromMnemonic(words, path = exports.DEFAULT_DERIVATION_PATH) {
        return new PrivateKey(ethers_1.Wallet.fromMnemonic(words, path));
    }
    /**
     * Create a PrivateKey instance from a given private key and a HD derivation path.
     * If path is not given, default to Band's HD prefix 494 and all other indexes being zeroes.
     * @param {string} privateKey  the private key
     * @returns {PrivateKey} Initialized PrivateKey object
     *
     * @deprecated - use fromHex instead
     */
    static fromPrivateKey(privateKey) {
        return new PrivateKey(new ethers_1.Wallet(privateKey));
    }
    /**
     * Create a PrivateKey instance from a given private key and a HD derivation path.
     * If path is not given, default to Band's HD prefix 494 and all other indexes being zeroes.
     * @param {string} privateKey  the private key
     * @returns {PrivateKey} Initialized PrivateKey object
     */
    static fromHex(privateKey) {
        const isString = typeof privateKey === 'string';
        const privateKeyHex = isString && privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
        const privateKeyBuff = isString
            ? Buffer.from(privateKeyHex.toString(), 'hex')
            : privateKey;
        return new PrivateKey(new ethers_1.Wallet(privateKeyBuff));
    }
    /**
     * Return the private key in hex
     * @returns {string}
     * */
    toPrivateKeyHex() {
        return this.wallet.privateKey.startsWith('0x')
            ? this.wallet.privateKey
            : `0x${this.wallet.privateKey}`;
    }
    /**
     * Return the PublicKey associated with this private key.
     * @returns {PublicKey} a Public key that can be used to verify the signatures made with this PrivateKey
     * */
    toPublicKey() {
        return public_key_1.PublicKey.fromHex(this.wallet.privateKey);
    }
    /**
     * Return a hex representation of signing key.
     * @returns {string}
     */
    toHex() {
        return this.wallet.address.startsWith('0x')
            ? this.wallet.address
            : `0x${this.wallet.address}`;
    }
    /**
     * Return the Address associated with this private key.
     * @returns {Address}
     * */
    toAddress() {
        return address_1.Address.fromHex(this.toHex());
    }
    /**
     * Return the Bech32 address associated with this private key.
     * @returns {string}
     * */
    toBech32() {
        return address_1.Address.fromHex(this.toHex()).toBech32();
    }
    /**
     * Sign the given message using the wallet's _signingKey function.
     * @param {string} messageBytes: the message that will be hashed and signed, a Buffer made of bytes
     * @returns {Uint8Array} a signature of this private key over the given message
     */
    async sign(messageBytes) {
        const { wallet } = this;
        const msgHash = (0, keccak256_1.default)(messageBytes);
        const signature = await wallet._signingKey().signDigest(msgHash);
        const splitSignature = BytesUtils.splitSignature(signature);
        return BytesUtils.arrayify(BytesUtils.concat([splitSignature.r, splitSignature.s]));
    }
    /**
     * Sign the given message using the edcsa sign_deterministic function.
     * @param {Buffer} messageBytes: the message that will be hashed and signed, a Buffer made of bytes
     * @returns {Uint8Array} a signature of this private key over the given message
     */
    async signEcda(messageBytes) {
        const { wallet } = this;
        const msgHash = (0, keccak256_1.default)(messageBytes);
        const privateKeyHex = wallet.privateKey.startsWith('0x')
            ? wallet.privateKey.slice(2)
            : wallet.privateKey;
        const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
        const { signature } = secp256k1_1.default.ecdsaSign(msgHash, privateKey);
        return signature;
    }
    /**
     * Sign the given message using the wallet's _signingKey function.
     * @param {string} messageHashedBytes: the message that will be signed, a Buffer made of bytes
     * @returns {Uint8Array} a signature of this private key over the given message
     */
    async signHashed(messageHashedBytes) {
        const { wallet } = this;
        const signature = await wallet._signingKey().signDigest(messageHashedBytes);
        const splitSignature = BytesUtils.splitSignature(signature);
        return BytesUtils.arrayify(BytesUtils.concat([splitSignature.r, splitSignature.s]));
    }
    /**
     * Sign the given message using the edcsa sign_deterministic function.
     * @param {Buffer} messageHashedBytes: the message that will be signed, a Buffer made of bytes
     * @returns {Uint8Array} a signature of this private key over the given message
     */
    async signHashedEcda(messageHashedBytes) {
        const { wallet } = this;
        const privateKeyHex = wallet.privateKey.startsWith('0x')
            ? wallet.privateKey.slice(2)
            : wallet.privateKey;
        const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
        const { signature } = secp256k1_1.default.ecdsaSign(messageHashedBytes, privateKey);
        return signature;
    }
    /**
     * Sign the given typed data using the edcsa sign_deterministic function.
     * @param {Buffer} eip712Data: the typed data that will be hashed and signed, a Buffer made of bytes
     * @returns {Uint8Array} a signature of this private key over the given message
     */
    async signTypedData(eip712Data) {
        const { wallet } = this;
        const privateKeyHex = wallet.privateKey.startsWith('0x')
            ? wallet.privateKey.slice(2)
            : wallet.privateKey;
        const signature = (0, eth_sig_util_1.signTypedData)({
            privateKey: Buffer.from(privateKeyHex, 'hex'),
            data: eip712Data,
            version: eth_sig_util_1.SignTypedDataVersion.V4,
        });
        return Buffer.from(signature.replace('0x', ''), 'hex');
    }
    /**
     * Sign the given typed data using the edcsa sign_deterministic function.
     * @param {Buffer} eip712Data: the typed data that will be signed, a Buffer made of bytes
     * @returns {Uint8Array} a signature of this private key over the given message
     */
    async signHashedTypedData(eip712Data) {
        const { wallet } = this;
        const privateKeyHex = wallet.privateKey.startsWith('0x')
            ? wallet.privateKey.slice(2)
            : wallet.privateKey;
        const privateKey = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));
        const { signature } = secp256k1_1.default.ecdsaSign(eip712Data, privateKey);
        return signature;
    }
}
exports.PrivateKey = PrivateKey;
//# sourceMappingURL=private-key.js.map