import { dataToExecData, ExecArgBase, } from '../ExecArgBase';
/**
 * @category Contract Exec Arguments
 */
export default class ExecArgCreateRound extends ExecArgBase {
    static fromJSON(params) {
        return new ExecArgCreateRound(params);
    }
    toData() {
        const { params } = this;
        return {
            name: params.name,
            start_date: params.startDate,
            end_date: params.endDate,
        };
    }
    toExecData() {
        return dataToExecData('create_round', this.toData());
    }
}