import { Account } from "@cosmjs/stargate";
import { InjectiveTypesV1Beta1Account } from "@injectivelabs/core-proto-ts";

export const accountParser = (ethAccount: any): Account => {
  const account = InjectiveTypesV1Beta1Account.EthAccount.decode(
    ethAccount.value as Uint8Array
  );
  const baseAccount = account.baseAccount!;
  const pubKey = baseAccount.pubKey;

  return {
    address: baseAccount.address,
    pubkey: pubKey
      ? {
          type: "/ethermint.crypto.v1.ethsecp256k1.PubKey",
          value: Buffer.from(pubKey.value).toString("base64"),
        }
      : null,
    accountNumber: parseInt(baseAccount.accountNumber, 10),
    sequence: parseInt(baseAccount.sequence, 10),
  };
};
