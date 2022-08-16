import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import ClientApiClient from "../clients/metaApi/clientApi.client";
import HistoryStorage from "./historyStorage";
import MetatraderAccount from "./metatraderAccount";
import StreamingMetaApiConnection from "./streamingMetaApiConnection";

/**
 * Manages account connections
 */
export default class ConnectionRegistry {
  
  /**
   * Constructs a MetaTrader connection registry instance
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client API client
   * @param {string} application application id
   * @param {string} refreshSubscriptionsOpts subscriptions refresh options
   */
  constructor(metaApiWebsocketClient: MetaApiWebsocketClient, clientApiClient: ClientApiClient, application: string, refreshSubscriptionsOpts: string);
  
  /**
   * Creates and returns a new account connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   * @param {Date} [historyStartTime] history start time
   * @return {StreamingMetaApiConnection} streaming metaapi connection
   */
  connect(account: MetatraderAccount, historyStorage: HistoryStorage, historyStartTime?: Date): StreamingMetaApiConnection;
  
  /**
   * Removes an account from registry
   * @param {string} accountId MetaTrader account id to remove
   */
  remove(accountId: string): void;
  
  /**
   * Returns application type
   * @return {string} application type
   */
  get application(): string;
}