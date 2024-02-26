"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pubkeyType = exports.DYM_FEE_COEF = exports.DYM_GAS = exports.DYM_FEE = exports.DYM_DERIVATION_PATH = exports.DYM_TX_SUCCESS_CODE = exports.DYM_ALREADY_IN_POOL_CODE = exports.DYM_DENOM = exports.TICKER_NAME = void 0;
exports.TICKER_NAME = 'dym';
exports.DYM_DENOM = 'adym';
exports.DYM_ALREADY_IN_POOL_CODE = 19;
exports.DYM_TX_SUCCESS_CODE = 0;
exports.DYM_DERIVATION_PATH = "m/44'/60'/0'/0/0";
// this fee used only to simulate tx
exports.DYM_FEE = '0.05';
exports.DYM_GAS = '25000000000adym';
exports.DYM_FEE_COEF = 1.2;
exports.pubkeyType = {
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/ed25519/ed25519.go#L22 */
    secp256k1: 'tendermint/PubKeySecp256k1',
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/secp256k1/secp256k1.go#L23 */
    ed25519: 'tendermint/PubKeyEd25519',
    /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/sr25519/codec.go#L12 */
    sr25519: 'tendermint/PubKeySr25519',
    multisigThreshold: 'tendermint/PubKeyMultisigThreshold',
};
//# sourceMappingURL=constants.js.map