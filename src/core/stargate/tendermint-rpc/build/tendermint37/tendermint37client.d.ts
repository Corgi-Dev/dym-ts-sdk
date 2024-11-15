import { HttpEndpoint, RpcClient } from '../rpcclients';
import * as requests from './requests';
import * as responses from './responses';

export declare class Tendermint37Client {
  /**
     * Creates a new Tendermint client for the given endpoint.
     *
     * Uses HTTP when the URL schema is http or https. Uses WebSockets otherwise.
     */
  static connect(endpoint: string | HttpEndpoint): Promise<Tendermint37Client>;

  /**
     * Creates a new Tendermint client given an RPC client.
     */
  static create(rpcClient: RpcClient): Promise<Tendermint37Client>;

  private static detectVersion;

  private readonly client;

  /**
     * Use `Tendermint37Client.connect` or `Tendermint37Client.create` to create an instance.
     */
  private constructor();

  disconnect(): void;

  abciInfo(): Promise<responses.AbciInfoResponse>;

  abciQuery(params: requests.AbciQueryParams): Promise<responses.AbciQueryResponse>;

  block(height?: number): Promise<responses.BlockResponse>;

  blockResults(height?: number): Promise<responses.BlockResultsResponse>;

  /**
     * Search for events that are in a block.
     *
     * NOTE
     * This method will error on any node that is running a Tendermint version lower than 0.34.9.
     *
     * @see https://docs.tendermint.com/master/rpc/#/Info/block_search
     */
  blockSearch(params: requests.BlockSearchParams): Promise<responses.BlockSearchResponse>;

  blockSearchAll(params: requests.BlockSearchParams): Promise<responses.BlockSearchResponse>;

  /**
     * Queries block headers filtered by minHeight <= height <= maxHeight.
     *
     * @param minHeight The minimum height to be included in the result. Defaults to 0.
     * @param maxHeight The maximum height to be included in the result. Defaults to infinity.
     */
  blockchain(minHeight?: number, maxHeight?: number): Promise<responses.BlockchainResponse>;

  /**
     * Broadcast transaction to mempool and wait for response
     *
     * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_sync
     */
  broadcastTxSync(params: requests.BroadcastTxParams): Promise<responses.BroadcastTxSyncResponse>;

  /**
     * Broadcast transaction to mempool and do not wait for result
     *
     * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_async
     */
  broadcastTxAsync(params: requests.BroadcastTxParams): Promise<responses.BroadcastTxAsyncResponse>;

  /**
     * Broadcast transaction to mempool and wait for block
     *
     * @see https://docs.tendermint.com/master/rpc/#/Tx/broadcast_tx_commit
     */
  broadcastTxCommit(params: requests.BroadcastTxParams): Promise<responses.BroadcastTxCommitResponse>;

  commit(height?: number): Promise<responses.CommitResponse>;

  genesis(): Promise<responses.GenesisResponse>;

  health(): Promise<responses.HealthResponse>;

  numUnconfirmedTxs(): Promise<responses.NumUnconfirmedTxsResponse>;

  status(): Promise<responses.StatusResponse>;

  /**
     * Get a single transaction by hash
     *
     * @see https://docs.tendermint.com/master/rpc/#/Info/tx
     */
  tx(params: requests.TxParams): Promise<responses.TxResponse>;

  /**
     * Search for transactions that are in a block
     *
     * @see https://docs.tendermint.com/master/rpc/#/Info/tx_search
     */
  txSearch(params: requests.TxSearchParams): Promise<responses.TxSearchResponse>;

  txSearchAll(params: requests.TxSearchParams): Promise<responses.TxSearchResponse>;

  validators(params: requests.ValidatorsParams): Promise<responses.ValidatorsResponse>;

  validatorsAll(height?: number): Promise<responses.ValidatorsResponse>;

  private doCall;

  private subscribe;
}
