"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortedJsonStringify = exports.serializeSignDoc = exports.escapeCharacters = exports.EthSecp256k1Wallet = void 0;
const encoding_1 = require("@cosmjs/encoding");
const public_key_1 = require("./public-key");
const private_key_1 = require("./private-key");
class EthSecp256k1Wallet {
    /**
     * Creates a EthSecp256k1Wallet from the given private key
     *
     * @param privKey The private key.
     * @param prefix The bech32 address prefix (human readable part)
     */
    static async fromKey(privKey, prefix = 'dym') {
        const publicKey = private_key_1.PrivateKey.fromHex(Buffer.from(privKey).toString('hex'))
            .toPublicKey()
            .toPubKeyBytes();
        return new EthSecp256k1Wallet(privKey, publicKey, prefix);
    }
    privkey;
    pubkey;
    prefix;
    constructor(privKey, pubKey, prefix) {
        this.privkey = privKey;
        this.pubkey = pubKey;
        this.prefix = prefix;
    }
    get address() {
        return public_key_1.PublicKey.fromBytes(this.pubkey).toAddress().toBech32(this.prefix);
    }
    getAccounts() {
        return [
            {
                algo: 'eth_secp256k1',
                address: this.address,
                pubkey: this.pubkey,
            },
        ];
    }
    async signAmino(signerAddress, signDoc) {
        if (signerAddress !== this.address) {
            throw new Error(`Address ${signerAddress} not found in wallet`);
        }
        const messageBytes = serializeSignDoc(signDoc);
        const signature = await private_key_1.PrivateKey.fromHex(Buffer.from(this.privkey)).sign(Buffer.from(messageBytes));
        return {
            signed: signDoc,
            signature: {
                pub_key: {
                    type: 'tendermint/PubKeyEthSecp256k1',
                    value: public_key_1.PublicKey.fromBytes(this.pubkey).toBase64(),
                },
                signature: Buffer.from(signature).toString('base64'),
            },
        };
    }
}
exports.EthSecp256k1Wallet = EthSecp256k1Wallet;
function escapeCharacters(input) {
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
exports.escapeCharacters = escapeCharacters;
function serializeSignDoc(signDoc) {
    const serialized = escapeCharacters(sortedJsonStringify(signDoc));
    return (0, encoding_1.toUtf8)(serialized);
}
exports.serializeSignDoc = serializeSignDoc;
function sortedObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(sortedObject);
    }
    const sortedKeys = Object.keys(obj).sort();
    const result = {};
    // NOTE: Use forEach instead of reduce for performance with large objects eg Wasm code
    sortedKeys.forEach((key) => {
        result[key] = sortedObject(obj[key]);
    });
    return result;
}
/** Returns a JSON string with objects sorted by key */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function sortedJsonStringify(obj) {
    return JSON.stringify(sortedObject(obj));
}
exports.sortedJsonStringify = sortedJsonStringify;
//# sourceMappingURL=index.js.map