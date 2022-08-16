import StreamingMetaApiConnection from './streamingMetaApiConnection';

/**
 * Manages account connections
 */
export default class ConnectionRegistry {

  /**
   * Constructs a MetaTrader connection registry instance
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client API client
   * @param {String} application application id
   * @param {String} refreshSubscriptionsOpts subscriptions refresh options
   */
  constructor(metaApiWebsocketClient, clientApiClient, application = 'MetaApi', refreshSubscriptionsOpts) {
    refreshSubscriptionsOpts = refreshSubscriptionsOpts || {};
    this._metaApiWebsocketClient = metaApiWebsocketClient;
    this._clientApiClient = clientApiClient;
    this._application = application;
    this._refreshSubscriptionsOpts = refreshSubscriptionsOpts;
    this._connections = {};
    this._connectionLocks = {};
  }
  
  /**
   * Creates and returns a new account connection if doesnt exist, otherwise returns old
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage
   * @param {Date} [historyStartTime] history start time
   * @return {StreamingMetaApiConnection} streaming metaapi connection
   */
  connect(account, historyStorage, historyStartTime) {
    if (this._connections[account.id]) {
      return this._connections[account.id];
    }
    this._connections[account.id] = new StreamingMetaApiConnection(this._metaApiWebsocketClient, 
      this._clientApiClient, account, historyStorage, this, historyStartTime, this._refreshSubscriptionsOpts);
    return this._connections[account.id];
  }

  /**
   * Removes an account from registry
   * @param {string} accountId MetaTrader account id to remove
   */
  remove(accountId) {
    if (this._connections[accountId]) {
      delete this._connections[accountId];
    }
  }

  /**
   * Returns application type
   * @return {String} application type
   */
  get application() {
    return this._application;
  }
}
