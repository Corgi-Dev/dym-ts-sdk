import { StdFee } from '@cosmjs/stargate';
import { AminoMsg } from '../../../../core/stargate/SigningStargateClient';
export declare type CosmjsAlgo = "secp256k1" | "ed25519" | "sr25519";
export interface AccountData {
    /** A printable address (typically bech32 encoded) */
    readonly address: string;
    readonly algo: any;
    readonly pubkey: Uint8Array;
}
export interface OfflineAminoSigner {
    /**
     * Get AccountData array from wallet. Rejects if not enabled.
     */
    readonly getAccounts: () => Promise<readonly AccountData[]>;
    /**
     * Request signature from whichever key corresponds to provided bech32-encoded address. Rejects if not enabled.
     *
     * The signer implementation may offer the user the ability to override parts of the signDoc. It must
     * return the doc that was signed in the response.
     *
     * @param signerAddress The address of the account that should sign the transaction
     * @param signDoc The content that should be signed
     */
    readonly signAmino: (signerAddress: string, signDoc: StdSignDoc) => Promise<any>;
}
export interface StdSignDoc {
    readonly chain_id: string;
    readonly account_number: string;
    readonly sequence: string;
    readonly fee: StdFee;
    readonly msgs: readonly AminoMsg[];
    readonly memo: string;
}
export type Algo = CosmjsAlgo | 'eth_secp256k1';
