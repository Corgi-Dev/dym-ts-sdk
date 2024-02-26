export declare const TICKER_NAME = "dym";
export declare const DYM_DENOM = "adym";
export declare const DYM_ALREADY_IN_POOL_CODE = 19;
export declare const DYM_TX_SUCCESS_CODE = 0;
export declare const DYM_DERIVATION_PATH = "m/44'/60'/0'/0/0";
export declare const DYM_FEE = "0.05";
export declare const DYM_GAS = "25000000000adym";
export declare const DYM_FEE_COEF = 1.2;
export declare const pubkeyType: {
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/ed25519/ed25519.go#L22 */
    secp256k1: "tendermint/PubKeySecp256k1";
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/secp256k1/secp256k1.go#L23 */
    ed25519: "tendermint/PubKeyEd25519";
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/sr25519/codec.go#L12 */
    sr25519: "tendermint/PubKeySr25519";
    multisigThreshold: "tendermint/PubKeyMultisigThreshold";
};
