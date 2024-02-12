import { MsgBase } from "../../MsgBase";
import snakecaseKeys from "snakecase-keys";
import { CosmosBaseV1Beta1Coin, CosmosStakingV1Beta1Tx, } from "@injectivelabs/core-proto-ts";
/**
 * @category Messages
 */
export default class MsgCancelUnbondingDelegation extends MsgBase {
    static fromJSON(params) {
        return new MsgCancelUnbondingDelegation(params);
    }
    toProto() {
        const { params } = this;
        const coinAmount = CosmosBaseV1Beta1Coin.Coin.create();
        coinAmount.denom = params.amount.denom;
        coinAmount.amount = params.amount.amount;
        const message = CosmosStakingV1Beta1Tx.MsgCancelUnbondingDelegation.create();
        message.amount = coinAmount;
        message.delegatorAddress = params.delegatorAddress;
        message.validatorAddress = params.validatorAddress;
        message.creationHeight = params.creationHeight;
        return CosmosStakingV1Beta1Tx.MsgCancelUnbondingDelegation.fromPartial(message);
    }
    toData() {
        const proto = this.toProto();
        return Object.assign({ "@type": "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation" }, proto);
    }
    toAmino() {
        const proto = this.toProto();
        const message = Object.assign({}, snakecaseKeys(proto));
        return {
            type: "cosmos-sdk/MsgCancelUnbondingDelegation",
            value: message,
        };
    }
    toWeb3() {
        const amino = this.toAmino();
        const { value } = amino;
        return Object.assign({ "@type": "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation" }, value);
    }
    toDirectSign() {
        const proto = this.toProto();
        return {
            type: "/cosmos.staking.v1beta1.MsgCancelUnbondingDelegation",
            message: proto,
        };
    }
    toBinary() {
        return CosmosStakingV1Beta1Tx.MsgCancelUnbondingDelegation.encode(this.toProto()).finish();
    }
}