/* eslint-disable max-params */
import { fromBase64 } from "@cosmjs/encoding";
import { Int53, Uint53 } from "@cosmjs/math";
import {
  EncodeObject,
  encodePubkey,
  isOfflineDirectSigner,
  makeAuthInfoBytes,
  makeSignDoc,
  OfflineSigner,
  Registry,
  TxBodyEncodeObject,
} from "@cosmjs/proto-signing";
import { assert, assertDefined } from "@cosmjs/utils";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import {
  MsgDelegate,
  MsgUndelegate,
} from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { SignMode } from "cosmjs-types/cosmos/tx/signing/v1beta1/signing";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgTransfer } from "cosmjs-types/ibc/applications/transfer/v1/tx";
import { Height } from "cosmjs-types/ibc/core/client/v1/client";
import {
  AminoConverters,
  AminoTypes,
  calculateFee,
  GasPrice,
  MsgDelegateEncodeObject,
  MsgSendEncodeObject,
  MsgTransferEncodeObject,
  MsgUndelegateEncodeObject,
  MsgWithdrawDelegatorRewardEncodeObject,
  createAuthzAminoConverters,
  createBankAminoConverters,
  createDistributionAminoConverters,
  createGovAminoConverters,
  createIbcAminoConverters,
  DeliverTxResponse,
  defaultRegistryTypes,
  StargateClientOptions,
} from "@cosmjs/stargate";
import { EthStargateClient, startWithChainIdPrefix } from "./stargate-client";
import { getPublicKey } from "./utils";
// eslint-disable-next-line import/no-relative-packages
import { HttpEndpoint, Tendermint37Client } from "./tendermint-rpc/build";
import { Secp256k1, sha256 } from "@cosmjs/crypto";
import { DirectSignResponse, makeSignBytes } from "@cosmjs/proto-signing";
import { StdSignature } from "@tendermint/sig";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { StdFee, StdSignDoc } from "@cosmjs/launchpad";

const pubkeyType = {
  /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/ed25519/ed25519.go#L22 */
  secp256k1: "tendermint/PubKeySecp256k1" as const,
  /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/secp256k1/secp256k1.go#L23 */
  ed25519: "tendermint/PubKeyEd25519" as const,
  /** @see https://github.com/tendermint/tendermint/blob/v0.33.0/crypto/sr25519/codec.go#L12 */
  sr25519: "tendermint/PubKeySr25519" as const,
  multisigThreshold: "tendermint/PubKeyMultisigThreshold" as const,
};

interface Pubkey {
  // type is one of the strings defined in pubkeyType
  // I don't use a string literal union here as that makes trouble with json test data:
  // https://github.com/cosmos/cosmjs/pull/44#pullrequestreview-353280504
  readonly type: string;
  /**
   * The base64 encoding of the Amino binary encoded pubkey.
   *
   * Note: if type is Secp256k1, this must contain a 33 bytes compressed pubkey.
   */
  readonly value: string;
}

interface Secp256k1Pubkey extends Pubkey {
  readonly type: "tendermint/PubKeySecp256k1";
  readonly value: string;
}

/**
 * Signing information for a single signer that is not included in the transaction.
 *
 * @see https://github.com/cosmos/cosmos-sdk/blob/v0.42.2/x/auth/signing/sign_mode_handler.go#L23-L37
 */
export interface SignerData {
  readonly accountNumber: number;
  readonly sequence: number;
  readonly chainId: string;
}

export interface SigningStargateClientOptions extends StargateClientOptions {
  readonly registry?: Registry;
  readonly aminoTypes?: AminoTypes;
  readonly broadcastTimeoutMs?: number;
  readonly broadcastPollIntervalMs?: number;
  readonly gasPrice?: GasPrice;
}

export function createDefaultAminoConverters(): AminoConverters {
  return {
    ...createAuthzAminoConverters(),
    ...createBankAminoConverters(),
    ...createDistributionAminoConverters(),
    ...createGovAminoConverters(),
    ...createIbcAminoConverters(),
  };
}

export class EthSigningStargateClient extends EthStargateClient {
  public readonly registry: Registry;

  public readonly broadcastTimeoutMs: number | undefined;

  public readonly broadcastPollIntervalMs: number | undefined;

  protected readonly signer: OfflineSigner;

  protected readonly aminoTypes: AminoTypes;

  protected readonly gasPrice: GasPrice | undefined;

  /**
   * Creates an instance by connecting to the given Tendermint RPC endpoint.
   *
   * For now this uses the Tendermint 0.34 client. If you need Tendermint 0.37
   * support, see `createWithSigner`.
   */
  public static async connectWithSigner(
    endpoint: string | HttpEndpoint,
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {}
  ): Promise<EthSigningStargateClient> {
    const tmClient = await Tendermint37Client.connect(endpoint);

    return EthSigningStargateClient.createWithSigner(tmClient, signer, options);
  }

  /**
   * Creates an instance from a manually created Tendermint client.
   * Use this to use `Tendermint37Client` instead of `Tendermint37Client`.
   */
  public static async createWithSigner(
    tmClient: any,
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {}
  ): Promise<EthSigningStargateClient> {
    return new EthSigningStargateClient(tmClient, signer, options);
  }

  /**
   * Creates a client in offline mode.
   *
   * This should only be used in niche cases where you know exactly what you're doing,
   * e.g. when building an offline signing application.
   *
   * When you try to use online functionality with such a signer, an
   * exception will be raised.
   */
  public static async offline(
    signer: OfflineSigner,
    options: SigningStargateClientOptions = {}
  ): Promise<EthSigningStargateClient> {
    return new EthSigningStargateClient(undefined, signer, options);
  }

  protected constructor(
    tmClient: any | undefined,
    signer: OfflineSigner,
    options: SigningStargateClientOptions
  ) {
    super(tmClient, options);
    const {
      registry = new Registry(defaultRegistryTypes),
      aminoTypes = new AminoTypes(createDefaultAminoConverters()),
    } = options;

    this.registry = registry;
    this.aminoTypes = aminoTypes;
    this.signer = signer;
    this.broadcastTimeoutMs = options.broadcastTimeoutMs;
    this.broadcastPollIntervalMs = options.broadcastPollIntervalMs;
    this.gasPrice = options.gasPrice;
  }

  public async simulate(
    signerAddress: string,
    messages: readonly EncodeObject[],
    memo: string | undefined
  ): Promise<number> {
    const anyMsgs = messages.map((m) => this.registry.encodeAsAny(m));
    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress
    );

    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }

    const pubkey = encodeSecp256k1Pubkey(accountFromSigner.pubkey);
    const { sequence } = await this.getSequence(signerAddress);
    const { gasInfo } = await this.forceGetQueryClient().tx.simulate(
      anyMsgs,
      memo,
      pubkey,
      sequence
    );

    assertDefined(gasInfo);

    return Uint53.fromString(gasInfo.gasUsed.toString()).toNumber();
  }

  public async sendTokens(
    senderAddress: string,
    recipientAddress: string,
    amount: readonly Coin[],
    fee: StdFee | "auto" | number,
    memo = ""
  ): Promise<DeliverTxResponse> {
    const sendMsg: MsgSendEncodeObject = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: senderAddress,
        toAddress: recipientAddress,
        amount: [...amount],
      },
    };

    return this.signAndBroadcast(senderAddress, [sendMsg], fee, memo);
  }

  public async delegateTokens(
    delegatorAddress: string,
    validatorAddress: string,
    amount: Coin,
    fee: StdFee | "auto" | number,
    memo = ""
  ): Promise<DeliverTxResponse> {
    const delegateMsg: MsgDelegateEncodeObject = {
      typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
      value: MsgDelegate.fromPartial({
        delegatorAddress,
        validatorAddress,
        amount,
      }),
    };

    return this.signAndBroadcast(delegatorAddress, [delegateMsg], fee, memo);
  }

  public async undelegateTokens(
    delegatorAddress: string,
    validatorAddress: string,
    amount: Coin,
    fee: StdFee | "auto" | number,
    memo = ""
  ): Promise<DeliverTxResponse> {
    const undelegateMsg: MsgUndelegateEncodeObject = {
      typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
      value: MsgUndelegate.fromPartial({
        delegatorAddress,
        validatorAddress,
        amount,
      }),
    };

    return this.signAndBroadcast(delegatorAddress, [undelegateMsg], fee, memo);
  }

  public async withdrawRewards(
    delegatorAddress: string,
    validatorAddress: string,
    fee: StdFee | "auto" | number,
    memo = ""
  ): Promise<DeliverTxResponse> {
    const withdrawMsg: MsgWithdrawDelegatorRewardEncodeObject = {
      typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
      value: MsgWithdrawDelegatorReward.fromPartial({
        delegatorAddress,
        validatorAddress,
      }),
    };

    return this.signAndBroadcast(delegatorAddress, [withdrawMsg], fee, memo);
  }

  public async sendIbcTokens(
    senderAddress: string,
    recipientAddress: string,
    transferAmount: Coin,
    sourcePort: string,
    sourceChannel: string,
    timeoutHeight: Height | undefined,
    /** timeout in seconds */
    timeoutTimestamp: number | undefined,
    fee: StdFee | "auto" | number,
    memo = ""
  ): Promise<DeliverTxResponse> {
    const timeoutTimestampNanoseconds = timeoutTimestamp
      ? // eslint-disable-next-line no-undef
        BigInt(timeoutTimestamp) * BigInt(1_000_000_000)
      : undefined;
    const transferMsg: MsgTransferEncodeObject = {
      typeUrl: "/ibc.applications.transfer.v1.MsgTransfer",
      value: MsgTransfer.fromPartial({
        sourcePort,
        sourceChannel,
        sender: senderAddress,
        receiver: recipientAddress,
        token: transferAmount,
        timeoutHeight,
        timeoutTimestamp: timeoutTimestampNanoseconds as any,
      }),
    };

    return this.signAndBroadcast(senderAddress, [transferMsg], fee, memo);
  }

  public async signAndBroadcast(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee | "auto" | number,
    memo = ""
  ): Promise<DeliverTxResponse> {
    let usedFee: StdFee;

    if (fee === "auto" || typeof fee === "number") {
      assertDefined(
        this.gasPrice,
        "Gas price must be set in the client options when auto gas is used."
      );
      const gasEstimation = await this.simulate(signerAddress, messages, memo);
      const multiplier = typeof fee === "number" ? fee : 1.3;

      usedFee = calculateFee(
        Math.round(gasEstimation * multiplier),
        this.gasPrice
      );
    } else {
      usedFee = fee;
    }

    const txRaw = await this.sign(signerAddress, messages, usedFee, memo);
    const txBytes = TxRaw.encode(txRaw).finish();

    return this.broadcastTx(
      txBytes,
      this.broadcastTimeoutMs,
      this.broadcastPollIntervalMs
    );
  }

  /**
   * Gets account number and sequence from the API, creates a sign doc,
   * creates a single signature and assembles the signed transaction.
   *
   * The sign mode (SIGN_MODE_DIRECT or SIGN_MODE_LEGACY_AMINO_JSON) is determined by this client's signer.
   *
   * You can pass signer data (account number, sequence and chain ID) explicitly instead of querying them
   * from the chain. This is needed when signing for a multisig account, but it also allows for offline signing
   * (See the SigningStargateClient.offline constructor).
   */
  public async sign(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string | undefined,
    explicitSignerData?: SignerData
  ): Promise<TxRaw> {
    let signerData: SignerData;

    if (explicitSignerData) {
      signerData = explicitSignerData;
    } else {
      const { accountNumber, sequence } = await this.getSequence(signerAddress);
      const chainId = await this.getChainId();

      signerData = {
        accountNumber,
        sequence,
        chainId,
      };
    }

    return isOfflineDirectSigner(this.signer)
      ? this.signDirect(signerAddress, messages, fee, memo, signerData)
      : this.signAmino(signerAddress, messages, fee, memo, signerData);
  }

  protected async signAmino(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string | undefined,
    { accountNumber, sequence, chainId }: SignerData
  ): Promise<TxRaw> {
    assert(!isOfflineDirectSigner(this.signer));

    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress
    );

    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }

    const pubkey = startWithChainIdPrefix(chainId)
      ? getPublicKey({
          chainId,
          key: Buffer.from(accountFromSigner.pubkey).toString("base64"),
        })
      : encodePubkey(encodeSecp256k1Pubkey(accountFromSigner.pubkey));
    const signMode = SignMode.SIGN_MODE_LEGACY_AMINO_JSON;
    const msgs = messages.map((msg) => this.aminoTypes.toAmino(msg));
    const signDoc = makeSignDocAmino(
      msgs,
      fee,
      chainId,
      memo,
      accountNumber,
      sequence
    );
    const { signature, signed } = await this.signer.signAmino(
      signerAddress,
      signDoc
    );
    const signedTxBody = {
      messages: signed.msgs.map((msg) => this.aminoTypes.fromAmino(msg)),
      memo: signed.memo,
    };
    const signedTxBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: signedTxBody,
    };
    const signedTxBodyBytes = this.registry.encode(signedTxBodyEncodeObject);
    const signedGasLimit = Int53.fromString(signed.fee.gas).toNumber();
    const signedSequence = Int53.fromString(signed.sequence).toNumber();
    const signedAuthInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence: signedSequence }],
      signed.fee.amount,
      signedGasLimit,
      127,
    );

    return TxRaw.fromPartial({
      bodyBytes: signedTxBodyBytes,
      authInfoBytes: signedAuthInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }

  protected async signDirect(
    signerAddress: string,
    messages: readonly EncodeObject[],
    fee: StdFee,
    memo: string | undefined,
    { accountNumber, sequence, chainId }: SignerData
  ): Promise<TxRaw> {
    assert(isOfflineDirectSigner(this.signer));

    const accountFromSigner = (await this.signer.getAccounts()).find(
      (account) => account.address === signerAddress
    );

    if (!accountFromSigner) {
      throw new Error("Failed to retrieve account from signer");
    }

    const pubkey = startWithChainIdPrefix(chainId)
      ? getPublicKey({
          chainId,
          key: Buffer.from(accountFromSigner.pubkey).toString("base64"),
        })
      : encodePubkey(encodeSecp256k1Pubkey(accountFromSigner.pubkey));

    const txBodyEncodeObject: TxBodyEncodeObject = {
      typeUrl: "/cosmos.tx.v1beta1.TxBody",
      value: {
        messages,
        memo,
      },
    };
    const txBodyBytes = this.registry.encode(txBodyEncodeObject);
    const gasLimit = Int53.fromString(fee.gas).toNumber();
    const authInfoBytes = makeAuthInfoBytes(
      [{ pubkey, sequence }],
      fee.amount,
      gasLimit,
      127
    );
    const signDoc = makeSignDoc(
      txBodyBytes,
      authInfoBytes,
      chainId,
      accountNumber
    );
    const { signature, signed } = await this.signer.signDirect(
      signerAddress,
      signDoc
    );

    return TxRaw.fromPartial({
      bodyBytes: signed.bodyBytes,
      authInfoBytes: signed.authInfoBytes,
      signatures: [fromBase64(signature.signature)],
    });
  }
}

export async function signerSignDirect(
  signDoc: SignDoc,
  privKey: Uint8Array,
  pubKey: Uint8Array
): Promise<DirectSignResponse> {
  const signBytes = makeSignBytes(signDoc);

  const hashedMessage = sha256(signBytes);
  const signature = await Secp256k1.createSignature(hashedMessage, privKey);
  const signatureBytes = new Uint8Array([
    ...signature.r(32),
    ...signature.s(32),
  ]);
  const stdSignature = encodeSecp256k1Signature(pubKey, signatureBytes);

  return {
    signed: signDoc,
    signature: stdSignature,
  };
}

function encodeSecp256k1Signature(
  pubkey: Uint8Array,
  signature: Uint8Array
): StdSignature {
  if (signature.length !== 64) {
    throw new Error(
      "Signature must be 64 bytes long. Cosmos SDK uses a 2x32 byte fixed length encoding for the secp256k1 signature integers r and s."
    );
  }

  return {
    pub_key: encodeSecp256k1Pubkey(pubkey),
    signature: Buffer.from(signature).toString("base64"),
  };
}

function encodeSecp256k1Pubkey(pubKey: Uint8Array): Secp256k1Pubkey {
  if (pubKey.length !== 33 || (pubKey[0] !== 0x02 && pubKey[0] !== 0x03)) {
    throw new Error(
      "Public key must be compressed secp256k1, i.e. 33 bytes starting with 0x02 or 0x03"
    );
  }

  return {
    type: pubkeyType.secp256k1,
    value: Buffer.from(pubKey).toString("base64"),
  };
}

interface AminoMsg {
  readonly type: string;
  readonly value: any;
}

// eslint-disable-next-line max-params
function makeSignDocAmino(
  msgs: readonly AminoMsg[],
  fee: StdFee,
  chainId: string,
  memo: string | undefined,
  accountNumber: number | string,
  sequence: number | string,
  timeoutHeight?: bigint
): StdSignDoc {
  return {
    chain_id: chainId,
    account_number: accountNumber.toString(),
    sequence: sequence.toString(),
    fee,
    msgs,
    memo: memo || "",
    ...(timeoutHeight && { timeout_height: timeoutHeight.toString() }),
  };
}
