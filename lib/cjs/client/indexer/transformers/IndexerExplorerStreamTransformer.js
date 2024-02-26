"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplorerStreamTransformer = void 0;
const IndexerGrpcExplorerTransformer_1 = require("./IndexerGrpcExplorerTransformer");
const index_1 = require("../../../types/index");
/**
 * @category Indexer Stream Transformer
 */
class ExplorerStreamTransformer {
    static blocksStreamCallback = (response) => ({
        block: IndexerGrpcExplorerTransformer_1.IndexerGrpcExplorerTransformer.grpcBlockToBlock(response),
        operation: index_1.StreamOperation.Insert,
    });
    static blocksWithTxsStreamCallback = (response) => ({
        block: IndexerGrpcExplorerTransformer_1.IndexerGrpcExplorerTransformer.grpcBlockToBlockWithTxs(response),
        operation: index_1.StreamOperation.Insert,
    });
    static transactionsStreamCallback = (response) => ({
        block: IndexerGrpcExplorerTransformer_1.IndexerGrpcExplorerTransformer.streamTxResponseToTxs(response),
        operation: index_1.StreamOperation.Insert,
    });
}
exports.ExplorerStreamTransformer = ExplorerStreamTransformer;
//# sourceMappingURL=IndexerExplorerStreamTransformer.js.map