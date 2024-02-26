import { AminoSignResponse, Secp256k1Wallet, StdSignDoc } from '@cosmjs/launchpad';
export declare class EthSecp256k1Wallet {
    /**
     * Creates a EthSecp256k1Wallet from the given private key
     *
     * @param privKey The private key.
     * @param prefix The bech32 address prefix (human readable part)
     */
    static fromKey(privKey: Uint8Array, prefix?: string): Promise<Secp256k1Wallet>;
    private readonly privkey;
    private readonly pubkey;
    private readonly prefix;
    private constructor();
    private get address();
    getAccounts(): {
        algo: string;
        address: string;
        pubkey: Uint8Array;
    }[];
    signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse>;
}
export declare function escapeCharacters(input: string): string;
export declare function serializeSignDoc(signDoc: StdSignDoc): Uint8Array;
/** Returns a JSON string with objects sorted by key */
export declare function sortedJsonStringify(obj: any): string;
