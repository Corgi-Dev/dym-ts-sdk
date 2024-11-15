import { PrivateKey } from "../PrivateKey";
import { PublicKey } from "../PublicKey";
import { AccountData, OfflineAminoSigner } from "./types/amino-signer";
import { AddressPrefix } from "../../..";
import { AminoSignResponse, Secp256k1Wallet, StdSignDoc, serializeSignDoc } from "@cosmjs/launchpad";
export class EthSecp256k1Wallet implements OfflineAminoSigner {
  /**
   * Creates a EthSecp256k1Wallet from the given private key
   *
   * @param privKey The private key.
   * @param prefix The bech32 address prefix (human readable part)
   */
  public static async fromKey(
    privKey: Uint8Array,
    prefix = AddressPrefix
  ): Promise<Secp256k1Wallet> {
    const publicKey = PrivateKey.fromHex(Buffer.from(privKey).toString("hex"))
      .toPublicKey()
      .toPubKeyBytes();

    return new EthSecp256k1Wallet(
      privKey,
      publicKey,
      prefix
    ) as unknown as Secp256k1Wallet;
  }

  private readonly privkey: Uint8Array;

  private readonly pubkey: Uint8Array;

  private readonly prefix: string;

  private constructor(privKey: Uint8Array, pubKey: Uint8Array, prefix: string) {
    this.privkey = privKey;
    this.pubkey = pubKey;
    this.prefix = prefix;
  }

  private get address(): string {
    return PublicKey.fromBytes(this.pubkey).toAddress().toBech32(this.prefix);
  }

  public async getAccounts(): Promise<readonly AccountData[]> {
    return [
      {
        algo: "eth_secp256k1",
        address: this.address,
        pubkey: this.pubkey,
      },
    ];
  }

  public async signAmino(
    signerAddress: string,
    signDoc: StdSignDoc
  ): Promise<AminoSignResponse> {
    if (signerAddress !== this.address) {
      throw new Error(`Address ${signerAddress} not found in wallet`);
    }

    const messageBytes = serializeSignDoc(signDoc);
    const signature = await PrivateKey.fromHex(Buffer.from(this.privkey)).sign(
      Buffer.from(messageBytes)
    );

    return {
      signed: signDoc,
      signature: {
        pub_key: {
          type: "tendermint/PubKeyEthSecp256k1",
          value: PublicKey.fromBytes(this.pubkey).toBase64(),
        },
        signature: Buffer.from(signature).toString("base64"),
      },
    };
  }
}
