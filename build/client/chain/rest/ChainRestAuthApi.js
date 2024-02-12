import { HttpRequestException, UnspecifiedErrorCode, } from "@injectivelabs/exceptions";
import BaseRestConsumer from "../../base/BaseRestConsumer";
import { ChainModule } from "../types";
import { startWithPrefix } from "../../../utils/check";
/**
 * @category Chain Rest API
 */
export class ChainRestAuthApi extends BaseRestConsumer {
    /**
     * Looks up the account information for the Injective address.
     *
     * @param address address of account to look up
     */
    async fetchAccount(address, params = {}) {
        const endpoint = `cosmos/auth/v1beta1/accounts/${address}`;
        try {
            const response = await this.retry(() => this.get(endpoint, params));
            return response.data;
        }
        catch (e) {
            if (e instanceof HttpRequestException) {
                throw e;
            }
            throw new HttpRequestException(new Error(e.message), {
                code: UnspecifiedErrorCode,
                context: `${this.endpoint}/${endpoint}`,
                contextModule: ChainModule.Auth,
            });
        }
    }
    /**
     * Looks up the account information for any cosmos chain address.
     *
     * @param address address of account to look up
     */
    async fetchCosmosAccount(address, params = {}) {
        const endpoint = `cosmos/auth/v1beta1/accounts/${address}`;
        try {
            const isInjectiveAddress = startWithPrefix(address);
            const response = await this.retry(() => this.get(endpoint, params));
            const baseAccount = isInjectiveAddress
                ? response.data.account.base_account
                : response.data.account;
            return baseAccount;
        }
        catch (e) {
            if (e instanceof HttpRequestException) {
                throw e;
            }
            throw new HttpRequestException(new Error(e.message), {
                code: UnspecifiedErrorCode,
                context: `${this.endpoint}/${endpoint}`,
                contextModule: ChainModule.Auth,
            });
        }
    }
}