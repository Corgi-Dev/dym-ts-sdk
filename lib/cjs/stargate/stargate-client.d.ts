import { Account, StargateClient } from '@cosmjs/stargate';
export declare const startWithChainIdPrefix: (chainId: string) => boolean;
export declare class EthStargateClient extends StargateClient {
    getAccount(searchAddress: string): Promise<Account | null>;
}
