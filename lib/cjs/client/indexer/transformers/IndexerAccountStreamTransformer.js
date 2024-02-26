"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexerAccountStreamTransformer = void 0;
const IndexerGrpcAccountTransformer_1 = require("./IndexerGrpcAccountTransformer");
const index_1 = require("../../../types/index");
/**
 * @category Indexer Stream Transformer
 */
class IndexerAccountStreamTransformer {
    static balanceStreamCallback = (response) => {
        const balance = response.balance;
        return {
            balance: balance
                ? IndexerGrpcAccountTransformer_1.IndexerGrpcAccountTransformer.grpcBalanceToBalance(balance)
                : undefined,
            operation: index_1.StreamOperation.Update,
            timestamp: response.timestamp,
        };
    };
}
exports.IndexerAccountStreamTransformer = IndexerAccountStreamTransformer;
//# sourceMappingURL=IndexerAccountStreamTransformer.js.map