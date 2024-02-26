import { Account, StargateClient, accountFromAny } from '@cosmjs/stargate';
import { accountParser } from './utils';

const chainIdPrefixs = ['injective', 'dymension', 'evmos'];

export const startWithChainIdPrefix = (chainId: string) => chainIdPrefixs.some((substr) => chainId.startsWith(substr));

export class EthStargateClient extends StargateClient {
  public async getAccount(searchAddress: string): Promise<Account | null> {
    try {
      const chainId = await this.getChainId();
      const isInjective = startWithChainIdPrefix(chainId);

      const account = await this.forceGetQueryClient().auth.account(
        searchAddress,
      );

      if (!account) {
        return null;
      }

      if (isInjective) {
        return accountParser(account);
      }

      return accountFromAny(account);
    } catch (error: any) {
      if (/rpc error: code = NotFound/i.test(error.toString())) {
        return null;
      }

      throw error;
    }
  }
}
