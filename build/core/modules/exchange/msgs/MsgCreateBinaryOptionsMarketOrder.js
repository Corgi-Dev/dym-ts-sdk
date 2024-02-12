import { MsgBase } from "../../MsgBase";
import { amountToCosmosSdkDecAmount } from "../../../../utils/numbers";
import snakecaseKeys from "snakecase-keys";
import { InjectiveExchangeV1Beta1Tx, InjectiveExchangeV1Beta1Exchange, } from "@injectivelabs/core-proto-ts";
const createMarketOrder = (params) => {
    const orderInfo = InjectiveExchangeV1Beta1Exchange.OrderInfo.create();
    orderInfo.subaccountId = params.subaccountId;
    orderInfo.feeRecipient = params.feeRecipient;
    orderInfo.price = params.price;
    orderInfo.quantity = params.quantity;
    if (params.cid) {
        orderInfo.cid = params.cid;
    }
    const derivativeOrder = InjectiveExchangeV1Beta1Exchange.DerivativeOrder.create();
    derivativeOrder.marketId = params.marketId;
    derivativeOrder.orderType = params.orderType;
    derivativeOrder.orderInfo = orderInfo;
    derivativeOrder.margin = params.margin;
    derivativeOrder.triggerPrice = params.triggerPrice || "0";
    const message = InjectiveExchangeV1Beta1Tx.MsgCreateBinaryOptionsMarketOrder.create();
    message.sender = params.injectiveAddress;
    message.order = derivativeOrder;
    return InjectiveExchangeV1Beta1Tx.MsgCreateBinaryOptionsMarketOrder.fromPartial(message);
};
/**
 * @category Messages
 */
export default class MsgCreateBinaryOptionsMarketOrder extends MsgBase {
    static fromJSON(params) {
        return new MsgCreateBinaryOptionsMarketOrder(params);
    }
    toProto() {
        const { params: initialParams } = this;
        const params = {
            ...initialParams,
            price: amountToCosmosSdkDecAmount(initialParams.price).toFixed(),
            margin: amountToCosmosSdkDecAmount(initialParams.margin).toFixed(),
            triggerPrice: amountToCosmosSdkDecAmount(initialParams.triggerPrice || 0).toFixed(),
            quantity: amountToCosmosSdkDecAmount(initialParams.quantity).toFixed(),
        };
        return createMarketOrder(params);
    }
    toData() {
        const proto = this.toProto();
        return {
            "@type": "/injective.exchange.v1beta1.MsgCreateBinaryOptionsMarketOrder",
            ...proto,
        };
    }
    toAmino() {
        const { params } = this;
        const proto = createMarketOrder(params);
        const message = {
            ...snakecaseKeys(proto),
        };
        return {
            type: "exchange/MsgCreateBinaryOptionsMarketOrder",
            value: message,
        };
    }
    toWeb3() {
        const amino = this.toAmino();
        const { value } = amino;
        return {
            "@type": "/injective.exchange.v1beta1.MsgCreateBinaryOptionsMarketOrder",
            ...value,
        };
    }
    toDirectSign() {
        const proto = this.toProto();
        return {
            type: "/injective.exchange.v1beta1.MsgCreateBinaryOptionsMarketOrder",
            message: proto,
        };
    }
    toBinary() {
        return InjectiveExchangeV1Beta1Tx.MsgCreateBinaryOptionsMarketOrder.encode(this.toProto()).finish();
    }
}