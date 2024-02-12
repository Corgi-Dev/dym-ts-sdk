import { getNetworkEndpoints } from "@injectivelabs/networks";
import { BigNumber } from "@injectivelabs/utils";
import { GeneralException } from "@injectivelabs/exceptions";
import { Address } from "../../../../accounts/Address";
import { ChainGrpcExchangeApi } from "../../../../../client/chain/grpc/ChainGrpcExchangeApi";
import { domainHash, messageHash } from "../../../../../utils/crypto";
import { numberToCosmosSdkDecString } from "../../../../../utils/numbers";
import keccak256 from "keccak256";
import { InjectiveExchangeV1Beta1Exchange } from "@injectivelabs/core-proto-ts";
const spotOrderPrimaryType = "SpotOrder";
const derivativeOrderPrimaryType = "DerivativeOrder";
const EIP712DomainType = [
    {
        name: "name",
        type: "string",
    },
    {
        name: "version",
        type: "string",
    },
    {
        name: "chainId",
        type: "uint256",
    },
    {
        name: "verifyingContract",
        type: "address",
    },
    {
        name: "salt",
        type: "bytes32",
    },
];
const SpotOrderType = [
    {
        name: "MarketId",
        type: "string",
    },
    {
        name: "OrderInfo",
        type: "OrderInfo",
    },
    {
        name: "Salt",
        type: "string",
    },
    {
        name: "OrderType",
        type: "string",
    },
    {
        name: "TriggerPrice",
        type: "string",
    },
];
const DerivativeOrderType = [
    {
        name: "MarketId",
        type: "string",
    },
    {
        name: "OrderInfo",
        type: "OrderInfo",
    },
    {
        name: "OrderType",
        type: "string",
    },
    {
        name: "Margin",
        type: "string",
    },
    {
        name: "TriggerPrice",
        type: "string",
    },
    {
        name: "Salt",
        type: "string",
    },
];
const OrderInfoType = [
    {
        name: "SubaccountId",
        type: "string",
    },
    {
        name: "FeeRecipient",
        type: "string",
    },
    {
        name: "Price",
        type: "string",
    },
    {
        name: "Quantity",
        type: "string",
    },
];
const EIP712Domain = {
    name: "Injective Protocol",
    version: "2.0.0",
    chainId: `0x${new BigNumber(888).toString(16)}`,
    verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
};
const EIP712Types = {
    EIP712Domain: EIP712DomainType,
    [spotOrderPrimaryType]: SpotOrderType,
    [derivativeOrderPrimaryType]: DerivativeOrderType,
    OrderInfo: OrderInfoType,
};
const orderTypeToChainOrderType = (orderType) => {
    switch (orderType) {
        case InjectiveExchangeV1Beta1Exchange.OrderType.BUY:
            return "\u0001";
        case InjectiveExchangeV1Beta1Exchange.OrderType.SELL:
            return "\u0002";
        case InjectiveExchangeV1Beta1Exchange.OrderType.STOP_BUY:
            return "\u0003";
        case InjectiveExchangeV1Beta1Exchange.OrderType.STOP_SELL:
            return "\u0004";
        case InjectiveExchangeV1Beta1Exchange.OrderType.TAKE_BUY:
            return "\u0005";
        case InjectiveExchangeV1Beta1Exchange.OrderType.TAKE_SELL:
            return "\u0006";
        case InjectiveExchangeV1Beta1Exchange.OrderType.BUY_PO:
            return "\u0007";
        case InjectiveExchangeV1Beta1Exchange.OrderType.SELL_PO:
            return "\u0008";
        case InjectiveExchangeV1Beta1Exchange.OrderType.BUY_ATOMIC:
            return "\u0009";
        case InjectiveExchangeV1Beta1Exchange.OrderType.SELL_ATOMIC:
            return "\u000A";
        default:
            return "\u0001";
    }
};
const getEip712ForSpotOrder = (spotOrder, nonce) => {
    return {
        primaryType: spotOrderPrimaryType,
        types: EIP712Types,
        domain: EIP712Domain,
        message: {
            MarketId: spotOrder.marketId,
            OrderInfo: {
                SubaccountId: spotOrder.orderInfo.subaccountId,
                FeeRecipient: spotOrder.orderInfo.feeRecipient,
                Price: numberToCosmosSdkDecString(spotOrder.orderInfo.price),
                Quantity: numberToCosmosSdkDecString(spotOrder.orderInfo.quantity),
            },
            Salt: nonce.toString(),
            OrderType: orderTypeToChainOrderType(spotOrder.orderType),
            TriggerPrice: spotOrder.triggerPrice
                ? numberToCosmosSdkDecString(spotOrder.triggerPrice)
                : "0.000000000000000000",
        },
    };
};
const getEip712ForDerivativeOrder = (derivativeOrder, nonce) => {
    return {
        primaryType: derivativeOrderPrimaryType,
        types: EIP712Types,
        domain: EIP712Domain,
        message: {
            MarketId: derivativeOrder.marketId,
            OrderInfo: {
                SubaccountId: derivativeOrder.orderInfo.subaccountId,
                FeeRecipient: derivativeOrder.orderInfo.feeRecipient,
                Price: numberToCosmosSdkDecString(derivativeOrder.orderInfo.price),
                Quantity: numberToCosmosSdkDecString(derivativeOrder.orderInfo.quantity),
            },
            Margin: numberToCosmosSdkDecString(derivativeOrder.margin),
            OrderType: orderTypeToChainOrderType(derivativeOrder.orderType),
            TriggerPrice: derivativeOrder.triggerPrice
                ? numberToCosmosSdkDecString(derivativeOrder.triggerPrice)
                : "0.000000000000000000",
            Salt: nonce.toString(),
        },
    };
};
export class OrderHashManager {
    subaccountIndex;
    address;
    network;
    nonce = 0;
    constructor({ network, address, subaccountIndex = 0 /* default trading account */, }) {
        this.network = network;
        this.address = address;
        this.subaccountIndex = subaccountIndex;
    }
    incrementNonce() {
        this.nonce += 1;
    }
    setNonce(nonce) {
        this.nonce = nonce;
    }
    /**
     * Keep in mind that the order params have to be transformed
     * in proper format that's supported on the chain
     */
    async getOrderHashes({ spotOrders = [], derivativeOrders = [], }) {
        if (spotOrders.length === 0 && derivativeOrders.length === 0) {
            throw new GeneralException(new Error("Please provide spot or derivative orders"));
        }
        await this.initSubaccountNonce();
        const spotOrderHashes = spotOrders.map((order) => {
            return this.incrementNonceAndReturn(this.hashTypedData(getEip712ForSpotOrder(order, this.nonce)));
        });
        const derivativeOrderHashes = derivativeOrders.map((order) => {
            return this.incrementNonceAndReturn(this.hashTypedData(getEip712ForDerivativeOrder(order, this.nonce)));
        });
        return {
            spotOrderHashes,
            derivativeOrderHashes,
        };
    }
    /**
     * Keep in mind that the order params have to be transformed
     * in proper format that's supported on the chain
     */
    async getDerivativeOrderHashes(orders) {
        if (orders.length === 0) {
            throw new GeneralException(new Error("Please provide orders"));
        }
        await this.initSubaccountNonce();
        return orders.map((order) => {
            return this.incrementNonceAndReturn(this.hashTypedData(getEip712ForDerivativeOrder(order, this.nonce)));
        });
    }
    /**
     * Keep in mind that the order params have to be transformed
     * in proper format that's supported on the chain
     */
    async getSpotOrderHashes(orders) {
        if (orders.length === 0) {
            throw new GeneralException(new Error("Please provide orders"));
        }
        await this.initSubaccountNonce();
        return orders.map((order) => {
            return this.incrementNonceAndReturn(this.hashTypedData(getEip712ForSpotOrder(order, this.nonce)));
        });
    }
    async getSpotOrderHashFromMsg(msg) {
        await this.initSubaccountNonce();
        const proto = msg.toAmino();
        const order = proto.value.order;
        if (!order) {
            throw new GeneralException(new Error("The MsgCreateSpotLimitOrder is not complete"));
        }
        const orderInfo = order.orderInfo;
        if (!orderInfo) {
            throw new GeneralException(new Error("The MsgCreateSpotLimitOrder is not complete"));
        }
        return this.incrementNonceAndReturn(this.hashTypedData(getEip712ForSpotOrder({
            marketId: order.marketId,
            orderInfo: {
                subaccountId: orderInfo.subaccountId,
                feeRecipient: orderInfo.feeRecipient,
                price: orderInfo.price,
                quantity: orderInfo.quantity,
            },
            orderType: order.orderType,
            triggerPrice: order.triggerPrice,
        }, this.nonce)));
    }
    async getDerivativeOrderHashFromMsg(msg) {
        await this.initSubaccountNonce();
        const proto = msg.toAmino();
        const order = proto.value.order;
        if (!order) {
            throw new GeneralException(new Error("The MsgCreateDerivativeLimitOrder is not complete"));
        }
        const orderInfo = order.orderInfo;
        if (!orderInfo) {
            throw new GeneralException(new Error("The MsgCreateDerivativeLimitOrder is not complete"));
        }
        return this.incrementNonceAndReturn(this.hashTypedData(getEip712ForDerivativeOrder({
            marketId: order.marketId,
            orderInfo: {
                subaccountId: orderInfo.subaccountId,
                feeRecipient: orderInfo.feeRecipient,
                price: orderInfo.price,
                quantity: orderInfo.quantity,
            },
            margin: order.margin,
            orderType: order.orderType,
            triggerPrice: order.triggerPrice,
        }, this.nonce)));
    }
    async initSubaccountNonce() {
        if (this.nonce) {
            return this.incrementNonce();
        }
        const { network, subaccountIndex, address } = this;
        const endpoints = getNetworkEndpoints(network);
        const chainGrpcExchangeApi = new ChainGrpcExchangeApi(endpoints.grpc);
        const subaccountId = Address.fromBech32(address).getSubaccountId(subaccountIndex);
        const { nonce } = await chainGrpcExchangeApi.fetchSubaccountTradeNonce(subaccountId);
        this.nonce = nonce + 1;
    }
    hashTypedData(eip712) {
        const bytesToHash = Buffer.concat([
            Buffer.from("19", "hex"),
            Buffer.from("01", "hex"),
            domainHash(eip712),
            messageHash(eip712),
        ]);
        try {
            return `0x${Buffer.from(keccak256(bytesToHash)).toString("hex")}`;
        }
        catch (e) {
            return "";
        }
    }
    incrementNonceAndReturn(result) {
        this.incrementNonce();
        return result;
    }
}