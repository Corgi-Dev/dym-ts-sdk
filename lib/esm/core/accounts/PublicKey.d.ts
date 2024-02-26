import { Address } from "./Address";
import { GoogleProtobufAny, InjectiveCryptoV1Beta1Ethsecp256k1Keys } from "@injectivelabs/core-proto-ts";
export declare const BECH32_PUBKEY_ACC_PREFIX = "injpub";
/**
 * @category Crypto Utility Classes
 */
export declare class PublicKey {
    private type;
    private key;
    private constructor();
    static fromBase64(publicKey: string): PublicKey;
    static fromBytes(publicKey: Uint8Array): PublicKey;
    static fromHex(privateKey: string | Uint8Array): PublicKey;
    toPubKeyBytes(): Uint8Array;
    toBase64(): string;
    toHex(): string;
    toBech32(): string;
    toAddress(): Address;
    toProto(): InjectiveCryptoV1Beta1Ethsecp256k1Keys.PubKey;
    toAny(): GoogleProtobufAny.Any;
}
