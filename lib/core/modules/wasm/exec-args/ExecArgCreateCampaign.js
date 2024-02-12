import { dataToExecData, ExecArgBase, } from '../ExecArgBase';
/**
 * @category Contract Exec Arguments
 */
export default class ExecArgCreateCampaign extends ExecArgBase {
    static fromJSON(params) {
        return new ExecArgCreateCampaign(params);
    }
    toData() {
        const { params } = this;
        return {
            name: params.name,
            rewards: params.rewards,
            in_round: params.inRound,
            market_id: params.marketId,
            description: params.description,
            subaccount_id_suffix: params.subaccountIdSuffix,
        };
    }
    toExecData() {
        return dataToExecData('create_campaign', this.toData());
    }
}