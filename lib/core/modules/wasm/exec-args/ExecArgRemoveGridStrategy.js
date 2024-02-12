import { dataToExecData, ExecArgBase, } from '../ExecArgBase';
/**
 * @category Contract Exec Arguments
 */
export default class ExecArgRemoveGridStrategy extends ExecArgBase {
    static fromJSON(params) {
        return new ExecArgRemoveGridStrategy(params);
    }
    toData() {
        const { params } = this;
        return {
            subaccount_id: params.subaccountId,
        };
    }
    toExecData() {
        return dataToExecData('remove_strategy', this.toData());
    }
}