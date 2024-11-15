"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKey = void 0;
const bech32_2_1 = require("bech32-2");
const ethereumjs_util_1 = require("ethereumjs-util");
const secp256k1_1 = __importDefault(require("secp256k1"));
const js_sha3_1 = require("js-sha3");
const core_proto_ts_1 = require("@injectivelabs/core-proto-ts");
const address_1 = require("./address");
const utils_1 = require("../utils");
// export function decompressPubKey(startsWith02Or03: string) {
//   // if already decompressed an not has trailing 04
//   const testBuffer = Buffer.from(startsWith02Or03, 'hex');
//   if (testBuffer.length === 64) startsWith02Or03 = `04${startsWith02Or03}`;
//   const unit8 = new Uint8Array(Buffer.from(startsWith02Or03, 'hex'));
//   const compressed = secp256k1.publicKeyConvert(unit8, false);
//   let decompressed = Buffer.from(compressed).toString('hex');
//   // remove trailing 04
//   decompressed = decompressed.substring(2);
//   return decompressed;
// }
/**
 * @category Crypto Utility Classes
 */
class PublicKey {
    type;
    key;
    constructor(key, type) {
        this.key = key;
        this.type = type || '/ethermint.crypto.v1.ethsecp256k1.PubKey';
    }
    static fromBase64(publicKey) {
        return new PublicKey(Buffer.from(publicKey, 'base64'));
    }
    static fromBytes(publicKey) {
        return new PublicKey(publicKey);
    }
    static fromHex(privateKey) {
        const isString = typeof privateKey === 'string';
        const privateKeyHex = isString && privateKey.startsWith('0x')
            ? privateKey.slice(2)
            : privateKey;
        const privateKeyBuff = Buffer.from(privateKeyHex.toString(), 'hex');
        const publicKeyByte = secp256k1_1.default.publicKeyCreate(privateKeyBuff, true);
        // const type = "/injective.crypto.v1beta1.ethsecp256k1.PubKey";
        const type = '/ethermint.crypto.v1.ethsecp256k1.PubKey';
        return new PublicKey(publicKeyByte, type);
    }
    toPubKeyBytes() {
        return this.key;
    }
    toBase64() {
        return Buffer.from(this.toPubKeyBytes()).toString('base64');
    }
    toHex() {
        return Buffer.from(this.toPubKeyBytes()).toString('hex');
    }
    toBech32() {
        return bech32_2_1.bech32.encode('injpub', this.key);
    }
    toAddress() {
        const publicKeyHex = this.toHex();
        const decompressedPublicKey = (0, utils_1.decompressPubKey)(publicKeyHex);
        const addressBuffer = Buffer.from((0, js_sha3_1.keccak256)((0, ethereumjs_util_1.toBuffer)(decompressedPublicKey.startsWith('0x')
            ? decompressedPublicKey
            : `0x${decompressedPublicKey}`)), 'hex').subarray(-20);
        return address_1.Address.fromHex(Buffer.from(addressBuffer).toString('hex').toLowerCase());
    }
    toProto() {
        const proto = core_proto_ts_1.InjectiveCryptoV1Beta1Ethsecp256k1Keys.PubKey.create();
        proto.key = this.key;
        return proto;
    }
    toAny() {
        const proto = this.toProto();
        const message = core_proto_ts_1.GoogleProtobufAny.Any.create();
        message.typeUrl = this.type;
        message.value = Buffer.from(core_proto_ts_1.InjectiveCryptoV1Beta1Ethsecp256k1Keys.PubKey.encode(proto).finish());
        return message;
    }
}
exports.PublicKey = PublicKey;
//# sourceMappingURL=public-key.js.map