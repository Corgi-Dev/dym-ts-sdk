"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthStargateClient = exports.startWithChainIdPrefix = void 0;
const stargate_1 = require("@cosmjs/stargate");
const utils_1 = require("./utils");
const chainIdPrefixs = ['injective', 'dymension', 'evmos'];
const startWithChainIdPrefix = (chainId) => chainIdPrefixs.some((substr) => chainId.startsWith(substr));
exports.startWithChainIdPrefix = startWithChainIdPrefix;
class EthStargateClient extends stargate_1.StargateClient {
    async getAccount(searchAddress) {
        try {
            const chainId = await this.getChainId();
            const isInjective = (0, exports.startWithChainIdPrefix)(chainId);
            const account = await this.forceGetQueryClient().auth.account(searchAddress);
            if (!account) {
                return null;
            }
            if (isInjective) {
                return (0, utils_1.accountParser)(account);
            }
            return (0, stargate_1.accountFromAny)(account);
        }
        catch (error) {
            if (/rpc error: code = NotFound/i.test(error.toString())) {
                return null;
            }
            throw error;
        }
    }
}
exports.EthStargateClient = EthStargateClient;
//# sourceMappingURL=stargate-client.js.map