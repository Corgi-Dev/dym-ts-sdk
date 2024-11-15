import { GrpcDerivativeMarketInfo, GrpcDerivativeLimitOrder, GrpcDerivativeTrade, DerivativeMarket, DerivativeLimitOrder, DerivativeTrade, PositionDelta, GrpcDerivativePosition, Position, GrpcPositionDelta, PerpetualMarketInfo, GrpcPerpetualMarketInfo, GrpcPerpetualMarketFunding, PerpetualMarketFunding, GrpcExpiryFuturesMarketInfo, GrpcFundingPayment, GrpcFundingRate, FundingPayment, FundingRate, ExpiryFuturesMarketInfo, GrpcBinaryOptionsMarketInfo, BinaryOptionsMarket, GrpcDerivativeOrderHistory, DerivativeOrderHistory, GrpcDerivativePositionV2, PositionV2 } from '../types/derivatives';
import { Orderbook, PriceLevel, GrpcTokenMeta, GrpcPriceLevel, IndexerTokenMeta, OrderbookWithSequence } from '../types/exchange';
import { InjectiveDerivativeExchangeRpc } from '@injectivelabs/indexer-proto-ts';
/**
 * @category Indexer Grpc Transformer
 */
export declare class IndexerGrpcDerivativeTransformer {
    static grpcTokenMetaToTokenMeta(tokenMeta: GrpcTokenMeta | undefined): IndexerTokenMeta | undefined;
    static grpcPerpetualMarketInfoToPerpetualMarketInfo(perpetualMarketInfo: GrpcPerpetualMarketInfo | undefined): PerpetualMarketInfo | undefined;
    static grpcPerpetualMarketFundingToPerpetualMarketFunding(perpetualMarketFunding: GrpcPerpetualMarketFunding | undefined): PerpetualMarketFunding | undefined;
    static grpcExpiryFuturesMarketInfoToExpiryFuturesMarketInfo(expiryFuturesMarketInfo: GrpcExpiryFuturesMarketInfo | undefined): ExpiryFuturesMarketInfo | undefined;
    static marketResponseToMarket(response: InjectiveDerivativeExchangeRpc.MarketResponse): DerivativeMarket;
    static marketsResponseToMarkets(response: InjectiveDerivativeExchangeRpc.MarketsResponse): DerivativeMarket[];
    static ordersResponseToOrders(response: InjectiveDerivativeExchangeRpc.OrdersResponse): {
        orders: DerivativeLimitOrder[];
        pagination: import("../../../types").ExchangePagination;
    };
    static orderHistoryResponseToOrderHistory(response: InjectiveDerivativeExchangeRpc.OrdersHistoryResponse): {
        orderHistory: DerivativeOrderHistory[];
        pagination: import("../../../types").ExchangePagination;
    };
    static positionsResponseToPositions(response: InjectiveDerivativeExchangeRpc.PositionsResponse): {
        positions: Position[];
        pagination: import("../../../types").ExchangePagination;
    };
    static positionsV2ResponseToPositionsV2(response: InjectiveDerivativeExchangeRpc.PositionsV2Response): {
        positions: PositionV2[];
        pagination: import("../../../types").ExchangePagination;
    };
    static tradesResponseToTrades(response: InjectiveDerivativeExchangeRpc.TradesResponse): {
        trades: DerivativeTrade[];
        pagination: import("../../../types").ExchangePagination;
    };
    static subaccountTradesListResponseToSubaccountTradesList(response: InjectiveDerivativeExchangeRpc.SubaccountTradesListResponse): DerivativeTrade[];
    static fundingPaymentsResponseToFundingPayments(response: InjectiveDerivativeExchangeRpc.FundingPaymentsResponse): {
        fundingPayments: FundingPayment[];
        pagination: import("../../../types").ExchangePagination;
    };
    static fundingRatesResponseToFundingRates(response: InjectiveDerivativeExchangeRpc.FundingRatesResponse): {
        fundingRates: FundingRate[];
        pagination: import("../../../types").ExchangePagination;
    };
    static orderbookV2ResponseToOrderbookV2(response: InjectiveDerivativeExchangeRpc.OrderbookV2Response): OrderbookWithSequence;
    static orderbooksV2ResponseToOrderbooksV2(response: InjectiveDerivativeExchangeRpc.OrderbooksV2Response): {
        marketId: string;
        orderbook: OrderbookWithSequence;
    }[];
    static binaryOptionsMarketResponseToBinaryOptionsMarket(response: InjectiveDerivativeExchangeRpc.BinaryOptionsMarketResponse): BinaryOptionsMarket;
    static binaryOptionsMarketResponseWithPaginationToBinaryOptionsMarket(response: InjectiveDerivativeExchangeRpc.BinaryOptionsMarketsResponse): {
        markets: BinaryOptionsMarket[];
        pagination: import("../../../types").ExchangePagination;
    };
    static binaryOptionsMarketsResponseToBinaryOptionsMarkets(response: InjectiveDerivativeExchangeRpc.BinaryOptionsMarketsResponse): BinaryOptionsMarket[];
    static grpcBinaryOptionsMarketToBinaryOptionsMarket(market: GrpcBinaryOptionsMarketInfo): BinaryOptionsMarket;
    static grpcBinaryOptionsMarketsToBinaryOptionsMarkets(markets: GrpcBinaryOptionsMarketInfo[]): BinaryOptionsMarket[];
    static grpcMarketToMarket(market: GrpcDerivativeMarketInfo): DerivativeMarket;
    static grpcMarketsToMarkets(markets: GrpcDerivativeMarketInfo[]): DerivativeMarket[];
    static grpcPositionDeltaToPositionDelta(positionDelta: GrpcPositionDelta): PositionDelta;
    static grpcPriceLevelToPriceLevel(priceLevel: GrpcPriceLevel): PriceLevel;
    static grpcPriceLevelsToPriceLevels(priceLevels: GrpcPriceLevel[]): PriceLevel[];
    static grpcOrderbookToOrderbook({ buys, sells, }: {
        buys: GrpcPriceLevel[];
        sells: GrpcPriceLevel[];
    }): Orderbook;
    static grpcOrderbookV2ToOrderbookV2({ sequence, buys, sells, }: {
        sequence: number;
        buys: GrpcPriceLevel[];
        sells: GrpcPriceLevel[];
    }): OrderbookWithSequence;
    static grpcOrderToOrder(order: GrpcDerivativeLimitOrder): DerivativeLimitOrder;
    static grpcOrdersToOrders(orders: GrpcDerivativeLimitOrder[]): DerivativeLimitOrder[];
    static grpcOrderHistoryToOrderHistory(orderHistory: GrpcDerivativeOrderHistory): DerivativeOrderHistory;
    static grpcOrderHistoryListToOrderHistoryList(orderHistory: GrpcDerivativeOrderHistory[]): DerivativeOrderHistory[];
    static grpcPositionToPosition(position: GrpcDerivativePosition): Position;
    static grpcPositionV2ToPositionV2(position: GrpcDerivativePositionV2): PositionV2;
    static grpcPositionsToPositions(positions: GrpcDerivativePosition[]): Position[];
    static grpcPositionsV2ToPositionsV2(positions: GrpcDerivativePositionV2[]): PositionV2[];
    static grpcTradeToTrade(trade: GrpcDerivativeTrade): DerivativeTrade;
    static grpcTradesToTrades(trades: GrpcDerivativeTrade[]): DerivativeTrade[];
    static grpcFundingPaymentToFundingPayment(fundingPayment: GrpcFundingPayment): FundingPayment;
    static grpcFundingPaymentsToFundingPayments(fundingPayments: GrpcFundingPayment[]): FundingPayment[];
    static grpcFundingRateToFundingRate(fundingRate: GrpcFundingRate): FundingRate;
    static grpcFundingRatesToFundingRates(fundingRates: GrpcFundingRate[]): FundingRate[];
}
