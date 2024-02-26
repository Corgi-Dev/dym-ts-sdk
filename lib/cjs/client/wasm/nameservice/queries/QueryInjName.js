"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryInjName = void 0;
const BaseWasmQuery_1 = require("../../BaseWasmQuery");
const index_1 = require("../../../../utils/index");
class QueryInjName extends BaseWasmQuery_1.BaseWasmQuery {
    toPayload() {
        return (0, index_1.toBase64)({
            name: {
                address: this.params.address,
            },
        });
    }
}
exports.QueryInjName = QueryInjName;
//# sourceMappingURL=QueryInjName.js.map