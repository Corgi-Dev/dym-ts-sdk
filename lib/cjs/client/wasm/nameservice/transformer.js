"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjNameServiceQueryTransformer = void 0;
const index_1 = require("../../../utils/index");
class InjNameServiceQueryTransformer {
    static resolverAddressResponseToResolverAddress(response) {
        const data = (0, index_1.fromBase64)((0, index_1.binaryToBase64)(response.data));
        return data.resolver || '';
    }
    static injectiveAddressResponseToInjectiveAddress(response) {
        const data = (0, index_1.fromBase64)((0, index_1.binaryToBase64)(response.data));
        return data.address || '';
    }
    static injectiveNameResponseToInjectiveName(response) {
        const data = (0, index_1.fromBase64)((0, index_1.binaryToBase64)(response.data));
        return data.name || '';
    }
}
exports.InjNameServiceQueryTransformer = InjNameServiceQueryTransformer;
//# sourceMappingURL=transformer.js.map