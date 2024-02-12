import { MsgBase } from "../../MsgBase";
import snakecaseKeys from "snakecase-keys";
import { InjectiveTokenFactoryV1Beta1Tx } from "@injectivelabs/core-proto-ts";
/**
 * @category Messages
 */
export default class MsgCreateDenom extends MsgBase {
    static fromJSON(params) {
        return new MsgCreateDenom(params);
    }
    toProto() {
        const { params } = this;
        const message = InjectiveTokenFactoryV1Beta1Tx.MsgCreateDenom.create();
        message.sender = params.sender;
        message.subdenom = params.subdenom;
        message.name = params.name || "";
        message.symbol = params.symbol || "";
        return InjectiveTokenFactoryV1Beta1Tx.MsgCreateDenom.fromPartial(message);
    }
    toData() {
        const proto = this.toProto();
        return {
            "@type": "/injective.tokenfactory.v1beta1.MsgCreateDenom",
            ...proto,
        };
    }
    toAmino() {
        const proto = this.toProto();
        const message = {
            ...snakecaseKeys(proto),
        };
        return {
            type: "injective/tokenfactory/create-denom",
            value: message,
        };
    }
    toWeb3() {
        const amino = this.toAmino();
        const { value } = amino;
        return {
            "@type": "/injective.tokenfactory.v1beta1.MsgCreateDenom",
            ...value,
        };
    }
    toDirectSign() {
        const proto = this.toProto();
        return {
            type: "/injective.tokenfactory.v1beta1.MsgCreateDenom",
            message: proto,
        };
    }
    toBinary() {
        return InjectiveTokenFactoryV1Beta1Tx.MsgCreateDenom.encode(this.toProto()).finish();
    }
}