import snakecaseKeys from "snakecase-keys";
import { MsgBase } from "../../MsgBase";
import { InjectiveExchangeV1Beta1Tx, InjectiveExchangeV1Beta1Exchange, } from "@injectivelabs/core-proto-ts";
/**
 * @category Messages
 */
export default class MsgBatchCancelSpotOrders extends MsgBase {
    static fromJSON(params) {
        return new MsgBatchCancelSpotOrders(params);
    }
    toProto() {
        const { params } = this;
        const orderDataList = params.orders.map((order) => {
            const orderData = InjectiveExchangeV1Beta1Tx.OrderData.create();
            orderData.marketId = order.marketId;
            orderData.subaccountId = order.subaccountId;
            if (order.orderHash) {
                orderData.orderHash = order.orderHash;
            }
            if (order.cid) {
                orderData.cid = order.cid;
            }
            // TODO: Send order.orderMask instead when chain handles order mask properly.
            orderData.orderMask = InjectiveExchangeV1Beta1Exchange.OrderMask.ANY;
            return orderData;
        });
        const message = InjectiveExchangeV1Beta1Tx.MsgBatchCancelSpotOrders.create();
        message.sender = params.injectiveAddress;
        message.data = orderDataList.map((o) => o);
        return InjectiveExchangeV1Beta1Tx.MsgBatchCancelSpotOrders.fromPartial(message);
    }
    toData() {
        const proto = this.toProto();
        return {
            "@type": "/injective.exchange.v1beta1.MsgBatchCancelSpotOrders",
            ...proto,
        };
    }
    toAmino() {
        const proto = this.toProto();
        const message = {
            ...snakecaseKeys(proto),
        };
        return {
            type: "exchange/MsgBatchCancelSpotOrders",
            value: message,
        };
    }
    toWeb3() {
        const amino = this.toAmino();
        const { value } = amino;
        return {
            "@type": "/injective.exchange.v1beta1.MsgBatchCancelSpotOrders",
            ...value,
        };
    }
    toDirectSign() {
        const proto = this.toProto();
        return {
            type: "/injective.exchange.v1beta1.MsgBatchCancelSpotOrders",
            message: proto,
        };
    }
    toBinary() {
        return InjectiveExchangeV1Beta1Tx.MsgBatchCancelSpotOrders.encode(this.toProto()).finish();
    }
}