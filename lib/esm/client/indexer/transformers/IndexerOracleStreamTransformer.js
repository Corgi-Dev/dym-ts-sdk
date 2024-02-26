"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexerOracleStreamTransformer = void 0;
const index_1 = require("../../../types/index");
/**
 * @category Indexer Stream Transformer
 */
class IndexerOracleStreamTransformer {
    static pricesStreamCallback = (response) => ({
        price: response.price,
        operation: index_1.StreamOperation.Update,
        timestamp: parseInt(response.timestamp, 10),
    });
    static pricesByMarketsCallback = (response) => ({
        ...response,
    });
}
exports.IndexerOracleStreamTransformer = IndexerOracleStreamTransformer;
//# sourceMappingURL=IndexerOracleStreamTransformer.js.map