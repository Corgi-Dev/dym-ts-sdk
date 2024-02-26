"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOutputQuantity = void 0;
const BaseWasmQuery_1 = require("../../BaseWasmQuery");
const index_1 = require("../../../../utils/index");
class QueryOutputQuantity extends BaseWasmQuery_1.BaseWasmQuery {
    toPayload() {
        return (0, index_1.toBase64)({
            get_output_quantity: {
                from_quantity: this.params.fromQuantity,
                source_denom: this.params.sourceDenom,
                target_denom: this.params.targetDenom,
            },
        });
    }
}
exports.QueryOutputQuantity = QueryOutputQuantity;
//# sourceMappingURL=QueryOutputQuantity.js.map