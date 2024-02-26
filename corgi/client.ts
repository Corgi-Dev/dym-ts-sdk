// /* eslint-disable class-methods-use-this */
// import { GasPrice, calculateFee } from '@cosmjs/stargate';
// import { TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
// import { PRECISIONS } from '../../../config/constants';
// import CosmosLike from '../provider';
// import Api from '../../../utils/api';
// import { getNodeUrlAndApiKey } from '../../../utils/cache-daemon-node-url';
// import { IJsonHTTPReq, NodeUrl } from '../../types';
// import {
//   divideIntoPrecision,
//   mulIntoPrecision,
//   safeSub,
// } from '../../../utils/provider-utils';
// import { CreateRawTxOptions } from '../../../transfer/types';
// import {
//   DYM_ALREADY_IN_POOL_CODE,
//   DYM_DENOM,
//   DYM_FEE,
//   DYM_FEE_COEF,
//   DYM_GAS,
//   DYM_TX_SUCCESS_CODE,
//   TICKER_NAME,
// } from './constants';
// import { EthSecp256k1Wallet } from './ethsecp';
// import { EthSigningStargateClient } from './stargate';
// import { DymTxBroadcastResponse } from './types';

// export default class Dym extends CosmosLike {
//   private static instance: Dym;

//   private constructor() {
//     super(TICKER_NAME, DYM_FEE, DYM_GAS, DYM_DENOM, PRECISIONS.DYM);
//   }

//   public static getInstance(): Dym {
//     if (!Dym.instance) {
//       Dym.instance = new Dym();
//     }

//     return Dym.instance;
//   }

//   async getOptions(httpMethod?: string, body?: any): Promise<IJsonHTTPReq> {
//     await this.setNode();

//     const options = { ...this.options };

//     const {
//       url, queryName, queryValue, headerName, headerValue,
//     } = this
//       .node as NodeUrl;

//     if (httpMethod === 'POST') {
//       options.body = body;
//     }

//     options.method = httpMethod || 'GET';

//     if (queryName && queryValue) {
//       options.qs = {
//         [queryName]: queryValue,
//       };
//     }

//     if (headerName && headerValue) {
//       options.headers = {
//         [headerName]: headerValue,
//       };
//     }

//     return { ...options, prefixUrl: url };
//   }

//   async setNode() {
//     const node = await getNodeUrlAndApiKey(this.ticker);

//     this.node = node;
//   }

//   getId(): string {
//     return this.ticker;
//   }

//   async createRawTx({
//     addressTo,
//     amountTo,
//     privateKey,
//     extraTo,
//   }: CreateRawTxOptions) {
//     const privateKeyHex = privateKey.startsWith('0x')
//       ? privateKey.substring(2)
//       : privateKey;

//     const amount = {
//       denom: 'adym',
//       amount: mulIntoPrecision(safeSub(amountTo, this.fee), this.precision).toString(),
//     };

//     const signer = await EthSecp256k1Wallet.fromKey(
//       Buffer.from(privateKeyHex, 'hex'),
//     );

//     const signerAddress = (await signer.getAccounts())[0].address;
//     const client = await EthSigningStargateClient.connectWithSigner(
//       'https://rpc.dymension.nodestake.org',
//       signer,
//     );

//     // All the rest of the code is the same when working with @cosmjs/stargate
//     const sendMsg = {
//       typeUrl: '/cosmos.bank.v1beta1.MsgSend',
//       value: {
//         fromAddress: signerAddress,
//         toAddress: addressTo,
//         amount: [amount],
//       },
//     };

//     const simulate = await client.simulate(signerAddress, [sendMsg], extraTo);
//     const usedFee = calculateFee(
//       Math.round(simulate * DYM_FEE_COEF),
//       GasPrice.fromString(this.gas),
//     );

//     const amountMinusFee = safeSub(
//       mulIntoPrecision(amountTo, this.precision),
//       usedFee.amount[0].amount,
//     );

//     const sendMsgMinusFee = {
//       typeUrl: '/cosmos.bank.v1beta1.MsgSend',
//       value: {
//         fromAddress: signerAddress,
//         toAddress: addressTo,
//         amount: [
//           {
//             denom: 'adym',
//             amount: amountMinusFee.toString(),
//           },
//         ],
//       },
//     };

//     const signed = await client.sign(
//       signerAddress,
//       [sendMsgMinusFee],
//       usedFee,
//       extraTo,
//     );

//     const txBytes = TxRaw.encode(signed).finish();

//     return {
//       rawTx: Buffer.from(txBytes).toString('hex'),
//       amount: safeSub(amountTo, this.fee).toString(),
//       tickerFee: TICKER_NAME,
//       amountFee: divideIntoPrecision(
//         usedFee.amount[0].amount,
//         this.precision,
//       ).toString(),
//     };
//   }

//   async sendRawTx(rawTx: string): Promise<string> {
//     const reqOptions = await this.getOptions('POST');

//     const txBroadcastResponse: DymTxBroadcastResponse = await Api.call(
//       'broadcast_tx_sync',
//       {
//         ...reqOptions,
//         qs: { tx: `0x${rawTx}` },
//       },
//     );

//     const { code, hash: txhash, log: rawLog } = txBroadcastResponse.result;

//     if (code !== DYM_TX_SUCCESS_CODE && code !== DYM_ALREADY_IN_POOL_CODE) {
//       // eslint-disable-next-line prefer-promise-reject-errors
//       return Promise.reject(
//         `${TICKER_NAME} send tx failed with code ${code}. Log: ${rawLog}`,
//       );
//     }

//     return txhash;
//   }
// }
