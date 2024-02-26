export type IDymAccountData = {
  account: {
    '@type': string; // '/cosmos.auth.v1beta1.BaseAccount'
    address: string;
    coins: DymAmountObject[];
    public_key: {
      '@type': string; // '/ethermint.crypto.v1.ethsecp256k1.PubKey'
      key: string;
    };
    account_number: string;
    sequence: string;
  };
};

type DymAmountObject = {
  denom: string;
  amount: string;
};

export type DymTxBroadcastResponse = {
  jsonrpc: '2.0';
  id: number;
  result: {
    code: number;
    data: string;
    log: string;
    hash: string;
  };
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

export interface Secp256k1Pubkey extends Pubkey {
  readonly type: 'tendermint/PubKeySecp256k1';
  readonly value: string;
}

export interface StdSignature {
  readonly pub_key: Pubkey;
  readonly signature: string;
}
