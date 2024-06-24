'use strict';
import LoggerManager from '../logger';
import MetaApiConnection from './metaApiConnection';
import TimeoutError from '../clients/timeoutError';

/**
 * Exposes MetaApi MetaTrader RPC API connection to consumers
 */
export default class RpcMetaApiConnection extends MetaApiConnection {

  /**
   * Constructs MetaApi MetaTrader RPC Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   */
  constructor(websocketClient, account) {
    super(websocketClient, account, 'RPC');
    this._logger = LoggerManager.getLogger('MetaApiConnection');
    this._websocketClient.addSynchronizationListener(account.id, this);
    this._stateByInstanceIndex = {};
  }

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @return {Promise} promise resolving when the connection is opened
   */
  async connect() {
    if (!this._opened) {
      this._opened = true;
      const accountRegions = this._account.accountRegions;
      this._websocketClient.addAccountCache(this._account.id, accountRegions);
      Object.keys(accountRegions).forEach(region => {
        this._websocketClient.ensureSubscribe(accountRegions[region], 0);
        this._websocketClient.ensureSubscribe(accountRegions[region], 1);
      });
    }
  }

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   */
  async close() {
    if (!this._closed) {
      this._websocketClient.removeAccountCache(this.account.id);
      this._closed = true;
    }
  }

  /**
   * Returns account information (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  getAccountInformation() {
    this._checkIsConnectionActive();
    return this._websocketClient.getAccountInformation(this._account.id);
  }

  /**
   * Returns positions (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  getPositions() {
    this._checkIsConnectionActive();
    return this._websocketClient.getPositions(this._account.id);
  }

  /**
   * Returns specific position (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  getPosition(positionId) {
    this._checkIsConnectionActive();
    return this._websocketClient.getPosition(this._account.id, positionId);
  }

  /**
   * Returns open orders (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  getOrders() {
    this._checkIsConnectionActive();
    return this._websocketClient.getOrders(this._account.id);
  }

  /**
   * Returns specific open order (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  getOrder(orderId) {
    this._checkIsConnectionActive();
    return this._websocketClient.getOrder(this._account.id, orderId);
  }

  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTicket(ticket) {
    this._checkIsConnectionActive();
    return this._websocketClient.getHistoryOrdersByTicket(this._account.id, ticket);
  }

  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByPosition(positionId) {
    this._checkIsConnectionActive();
    return this._websocketClient.getHistoryOrdersByPosition(this._account.id, positionId);
  }

  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTimeRange(startTime, endTime, offset = 0, limit = 1000) {
    this._checkIsConnectionActive();
    return this._websocketClient.getHistoryOrdersByTimeRange(this._account.id, startTime, endTime, offset, limit);
  }

  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTicket(ticket) {
    this._checkIsConnectionActive();
    return this._websocketClient.getDealsByTicket(this._account.id, ticket);
  }

  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByPosition(positionId) {
    this._checkIsConnectionActive();
    return this._websocketClient.getDealsByPosition(this._account.id, positionId);
  }

  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTimeRange(startTime, endTime, offset = 0, limit = 1000) {
    this._checkIsConnectionActive();
    return this._websocketClient.getDealsByTimeRange(this._account.id, startTime, endTime, offset, limit);
  }

  /**
   * Retrieves available symbols for an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @param {String} symbol symbol to retrieve symbols for
   * @returns {Promise<Array<string>>} promise which resolves when symbols are retrieved
   */
  getSymbols() {
    this._checkIsConnectionActive();
    return this._websocketClient.getSymbols(this._account.id);
  }

  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  getSymbolSpecification(symbol) {
    this._checkIsConnectionActive();
    return this._websocketClient.getSymbolSpecification(this._account.id, symbol);
  }

  /**
   * Retrieves latest price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {String} symbol symbol to retrieve price for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  getSymbolPrice(symbol, keepSubscription) {
    this._checkIsConnectionActive();
    return this._websocketClient.getSymbolPrice(this._account.id, symbol, keepSubscription);
  }

  /**
   * Retrieves latest candle for a symbol and timeframe (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {String} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  getCandle(symbol, timeframe, keepSubscription = false) {
    this._checkIsConnectionActive();
    return this._websocketClient.getCandle(this._account.id, symbol, timeframe, keepSubscription);
  }

  /**
   * Retrieves latest tick for a symbol. MT4 G1 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {String} symbol symbol to retrieve tick for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  getTick(symbol, keepSubscription = false) {
    this._checkIsConnectionActive();
    return this._websocketClient.getTick(this._account.id, symbol, keepSubscription);
  }

  /**
   * Retrieves latest order book for a symbol. MT4 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {string} symbol symbol to retrieve order book for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when order book is retrieved
   */
  getBook(symbol, keepSubscription = false) {
    this._checkIsConnectionActive();
    return this._websocketClient.getBook(this._account.id, symbol, keepSubscription);
  }

  /**
   * Returns server time for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readServerTime/).
   * @returns {Promise<ServerTime>} promise resolving with server time
   */
  async getServerTime() {
    this._checkIsConnectionActive();
    return this._websocketClient.getServerTime(this._account.id);
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected(instanceIndex, replicas) {
    const state = this._getState(instanceIndex);
    state.synchronized = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDisconnected(instanceIndex) {
    const state = this._getState(instanceIndex);
    state.synchronized = false;
    this._logger.debug(`${this._account.id}:${instanceIndex}: disconnected from broker`);
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   */
  async onStreamClosed(instanceIndex) {
    delete this._stateByInstanceIndex[instanceIndex];
  }

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @returns {Boolean} a flag indicating status of state synchronization with MetaTrader terminal
   */
  isSynchronized() {
    return Object.values(this._stateByInstanceIndex)
      .map(instance => instance.synchronized)
      .includes(true);
  }

  /**
   * Waits until synchronization to RPC application is completed
   * @param {Number} timeoutInSeconds synchronization timeout in seconds
   * @return {Promise} promise which resolves when synchronization to RPC application is completed
   * @throws {TimeoutError} if application failed to synchronize with the teminal within timeout allowed
   */
  async waitSynchronized(timeoutInSeconds=300) {
    this._checkIsConnectionActive();
    const startTime = Date.now();
    let synchronized = this.isSynchronized();
    while(!synchronized && startTime + timeoutInSeconds * 1000 > Date.now()) {
      await new Promise(res => setTimeout(res, 1000));
      synchronized = this.isSynchronized();
    }
    if (!synchronized) {
      throw new TimeoutError('Timed out waiting for MetaApi to synchronize to MetaTrader account ' +
        this._account.id);
    }
    // eslint-disable-next-line
    while(true) {
      try {
        await this._websocketClient.waitSynchronized(this._account.id, undefined, 'RPC', 5, 'RPC');
        break;
      } catch (err) {
        if(Date.now() > startTime + timeoutInSeconds * 1000) {
          throw err;
        }
      }
    }
  }

  _getState(instanceIndex) {
    if(!this._stateByInstanceIndex[instanceIndex]) {
      this._stateByInstanceIndex[instanceIndex] = {
        instanceIndex,
        synchronized: false,
      };
    }
    return this._stateByInstanceIndex[instanceIndex];
  }

}
