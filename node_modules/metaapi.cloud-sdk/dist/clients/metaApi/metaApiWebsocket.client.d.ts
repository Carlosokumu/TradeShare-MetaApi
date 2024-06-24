import HttpClient from "../httpClient";
import { TooManyRequestsErrorMetadata } from "../errorHandler";
import SynchronizationListener from "./synchronizationListener";
import LatencyListener from "./latencyListener"
import ReconnectListener from "./reconnectListener";

/**
 * MetaApi websocket API client (see https://metaapi.cloud/docs/client/websocket/overview/)
 */
export default class MetaApiWebsocketClient {
  
  /**
   * Constructs MetaApi websocket API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {string} token authorization token
   * @param {Object} opts websocket client options
   */
  constructor(httpClient: HttpClient, token: string, opts: Object);
  
  /**
   * Restarts the account synchronization process on an out of order packet
   * @param {string} accountId account id
   * @param {number} instanceIndex instance index
   * @param {number} expectedSequenceNumber expected s/n
   * @param {number} actualSequenceNumber actual s/n
   * @param {Object} packet packet data
   * @param {Date} receivedAt time the packet was received at
   */
   onOutOfOrderPacket(accountId: string, instanceIndex: number, expectedSequenceNumber: number, actualSequenceNumber: number, packet: Object, receivedAt: Date): void;
  
   /**
   * Patch server URL for use in unit tests
   * @param {string} url patched server URL
   */
  set url(url: string);

  /**
   * Websocket client predefined region
   * @returns {string} predefined region
   */
  get region(): string;
  
  /**
   * Returns the list of socket instance dictionaries
   * @return {Object[]} list of socket instance dictionaries
   */
  get socketInstances(): Object[];
  
  /**
   * Returns the dictionary of socket instances by account ids
   * @return {Object} dictionary of socket instances by account ids
   */
  get socketInstancesByAccounts(): Object;

  /**
   * Returns the dictionary of region names by account ids
   * @return {Object} dictionary of region names by account ids
   */
  get regionsByAccounts(): Object;
  
  /**
   * Returns the list of subscribed account ids
   * @param {number} instanceNumber instance index number
   * @param {string} socketInstanceIndex socket instance index
   * @param {string} region server region
   * @return {string[]} list of subscribed account ids
   */
  subscribedAccountIds(instanceNumber: number, socketInstanceIndex: string, region: string): string[];
  
  /**
   * Returns websocket client connection status
   * @param {number} instanceNumber instance index number
   * @param {number} socketInstanceIndex socket instance index
   * @param {string} region server region
   * @returns {boolean} websocket client connection status
   */
  connected(instanceNumber: number, socketInstanceIndex: number, region: string): boolean;
  
  /**
   * Returns list of accounts assigned to instance
   * @param {number} instanceNumber instance index number
   * @param {number} socketInstanceIndex socket instance index
   * @param {string} region server region
   * @returns {Array<number>}
   */
  getAssignedAccounts(instanceNumber: number, socketInstanceIndex: number, region: string): Array<number>;

  /**
   * Returns account region by id
   * @param {string} accountId account id
   * @returns {string} account region
   */
  getAccountRegion(accountId: string): string;

  /**
   * Adds account region info
   * @param {string} accountId account id
   * @param {Object} replicas account replicas
   */
  addAccountCache(accountId: string, replicas: Object): void;

  /**
   * Removes account region info
   * @param {string} accountId account id
   */
  removeAccountCache(accountId: string): void;

  /**
   * Locks subscription for a socket instance based on TooManyRequestsError metadata
   * @param {number} instanceNumber instance index number
   * @param {number} socketInstanceIndex socket instance index
   * @param {string} region server region
   * @param {TooManyRequestsErrorMetadata} metadata TooManyRequestsError metadata
   */
  lockSocketInstance(instanceNumber: number, socketInstanceIndex: number, region: string, metadata: TooManyRequestsErrorMetadata): Promise<void>;
  
  /**
   * Connects to MetaApi server via socket.io protocol
   * @param {number} instanceNumber instance index number
   * @param {string} region server region
   * @returns {Promise} promise which resolves when connection is established
   */
  connect(instanceNumber: number, region: string): Promise<any>
  
  /**
   * Closes connection to MetaApi server
   */
  close(): void;
  
  /**
   * Returns account information for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  getAccountInformation(accountId: string): Promise<MetatraderAccountInformation>;
  
  /**
   * Returns positions for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  getPositions(accountId: string): Promise<Array<MetatraderPosition>>;
  
  /**
   * Returns specific position for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {string} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  getPosition(accountId: string, positionId: string): Promise<MetatraderPosition>;
  
  /**
   * Returns open orders for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  getOrders(accountId: string): Promise<Array<MetatraderOrder>>;
  
  /**
   * Returns specific open order for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {string} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  getOrder(accountId: string, orderId: string): Promise<MetatraderOrder>;
  
  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {string} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTicket(accountId: string, ticket: string): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {string} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByPosition(accountId: string, positionId: string): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {number} offset pagination offset, default is 0
   * @param {number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  getHistoryOrdersByTimeRange(accountId: string, startTime: Date, endTime: Date, offset: number, limit: number): Promise<MetatraderHistoryOrders>;
  
  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {string} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTicket(accountId: string, ticket: string): Promise<MetatraderDeals>;
  
  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {string} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByPosition(accountId: string, positionId: string): Promise<MetatraderDeals>;
  
  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {string} accountId id of the MetaTrader account to return information for
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {number} offset pagination offset, default is 0
   * @param {number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  getDealsByTimeRange(accountId: string, startTime: Date, endTime: Date, offset: number, limit: number): Promise<MetatraderDeals>;
  
  /**
   * Clears the order and transaction history of a specified application and removes the application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @param {string} accountId id of the MetaTrader account to remove history and application for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeApplication(accountId: string): Promise<any>;
  
  /**
   * Execute a trade on a connected MetaTrader account (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {string} accountId id of the MetaTrader account to execute trade for
   * @param {MetatraderTrade} trade trade to execute (see docs for possible trade types)
   * @param {string} [application] application to use
   * @returns {Promise<MetatraderTradeResponse>} promise resolving with trade result
   */
  trade(accountId: string, trade: MetatraderTrade, application: string): Promise<MetatraderTradeResponse>;
  
  /**
   * Creates a task that ensures the account gets subscribed to the server
   * @param {string} accountId account id to subscribe
   * @param {number} [instanceNumber] instance index number
   */
  ensureSubscribe(accountId: string, instanceNumber: number): void;
  
  /**
   * Subscribes to the Metatrader terminal events (see https://metaapi.cloud/docs/client/websocket/api/subscribe/).
   * @param {string} accountId id of the MetaTrader account to subscribe to
   * @param {number} [instanceNumber] instance index number
   * @returns {Promise} promise which resolves when subscription started
   */
  subscribe(accountId: string, instanceNumber: number): Promise<any>;
  
  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/).
   * @param {string} accountId id of the MetaTrader account to synchronize
   * @param {number} instanceIndex instance index
   * @param {string} host name of host to synchronize with
   * @param {string} synchronizationId synchronization request id
   * @param {Date} startingHistoryOrderTime from what date to start synchronizing history orders from. If not specified,
   * the entire order history will be downloaded.
   * @param {Date} startingDealTime from what date to start deal synchronization from. If not specified, then all
   * history deals will be downloaded.
   * @param {Function} getHashes function to get terminal state hashes
   * @returns {Promise} promise which resolves when synchronization started
   */
  synchronize(accountId: string, instanceIndex: number, host: string, synchronizationId: string, startingHistoryOrderTime: Date, startingDealTime: Date, 
    getHashes: Function): Promise<any>;
  
    /**
   * Waits for server-side terminal state synchronization to complete.
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/waitSynchronized/).
   * @param {string} accountId id of the MetaTrader account to synchronize
   * @param {number} instanceNumber instance index number
   * @param {string} applicationPattern MetaApi application regular expression pattern, default is .*
   * @param {number} timeoutInSeconds timeout in seconds, default is 300 seconds
   * @param {string} [application] application to synchronize with
   * @returns {Promise} promise which resolves when synchronization started
   */
  waitSynchronized(accountId: string, instanceNumber: number, applicationPattern: string, timeoutInSeconds: number, application: string): Promise<any>;
  
  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {string} accountId id of the MetaTrader account
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update
   * @param {string} [reliability] account reliability
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(accountId: string, instanceNumber: number, symbol: string, subscriptions: Array<MarketDataSubscription>, reliability?: string): Promise<any>;
  
  /**
   * Refreshes market data subscriptions on the server to prevent them from expiring
   * @param {string} accountId id of the MetaTrader account
   * @param {number} instanceNumber instance index number
   * @param {Array} subscriptions array of subscriptions to refresh
   */
  refreshMarketDataSubscriptions(accountId: string, instanceNumber: number, subscriptions: Array<MarketDataSubscription>): Promise<any>;
  
  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {string} accountId id of the MetaTrader account
   * @param {number} instanceNumber instance index
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @param {string} [reliability] account reliability
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(accountId: string, instanceNumber: number, symbol: string, subscriptions: Array<MarketDataUnsubscription>, reliability?: string): Promise<any>;
  
  /**
   * Retrieves symbols available on an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbols for
   * @returns {Promise<Array<string>>} promise which resolves when symbols are retrieved
   */
  getSymbols(accountId: string): Promise<Array<string>>;
  
  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol specification for
   * @param {string} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  getSymbolSpecification(accountId: string, symbol: string): Promise<MetatraderSymbolSpecification>;
  
  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol price for
   * @param {string} symbol symbol to retrieve price for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  getSymbolPrice(accountId: string, symbol: string, keepSubscription?: boolean): Promise<MetatraderSymbolPrice>;
  
  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {string} accountId id of the MetaTrader account to retrieve candle for
   * @param {string} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  getCandle(accountId: string, symbol: string, timeframe: string, keepSubscription?: boolean): Promise<MetatraderCandle>;
  
  /**
   * Retrieves latest tick for a symbol. MT4 G1 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol tick for
   * @param {string} symbol symbol to retrieve tick for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  getTick(accountId: string, symbol: string, keepSubscription?: boolean): Promise<MetatraderTick>;
  
  /**
   * Retrieves latest order book for a symbol. MT4 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol order book for
   * @param {string} symbol symbol to retrieve order book for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderBook>} promise which resolves when order book is retrieved
   */
  getBook(accountId: string, symbol: string, keepSubscription?: boolean): Promise<MetatraderBook>
  
  /**
   * Sends client uptime stats to the server.
   * @param {string} accountId id of the MetaTrader account to save uptime
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(accountId: string, uptime: Object): Promise<any>;

  /**
   * Unsubscribe from account (see
   * https://metaapi.cloud/docs/client/websocket/api/synchronizing/unsubscribe).
   * @param {string} accountId id of the MetaTrader account to unsubscribe
   * @returns {Promise} promise which resolves when socket unsubscribed
   */
  unsubscribe(accountId: string): Promise<void>;

  /**
   * Returns server time for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readServerTime/).
   * @param {string} accountId id of the MetaTrader account to return server time for
   * @returns {Promise<ServerTime>} promise resolving with server time
   */
  getServerTime(accountId: string): Promise<ServerTime>;

  /**
   * Calculates margin required to open a trade on the specified trading account (see
   * https://metaapi.cloud/docs/client/websocket/api/calculateMargin/).
   * @param {string} accountId id of the trading account to calculate margin for
   * @param {string} application application to send the request to
   * @param {string} reliability account reliability
   * @param {MarginOrder} order order to calculate margin for
   * @returns {Promise<Margin>} promise resolving with margin calculation result
   */
  calculateMargin(accountId: string, application: string, reliability: string, order: MarginOrder): Promise<Margin>;

  /**
   * Calls onUnsubscribeRegion listener event 
   * @param {string} accountId account id
   * @param {string} region account region to unsubscribe
   */
  unsubscribeAccountRegion(accountId: string, region: string): Promise<void>;

  /**
   * Adds synchronization listener for specific account
   * @param {string} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(accountId: string, listener: SynchronizationListener): void;
  
  /**
   * Removes synchronization listener for specific account
   * @param {string} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(accountId: string, listener: SynchronizationListener): void;
  
  /**
   * Adds latency listener
   * @param {LatencyListener} listener latency listener to add
   */
  addLatencyListener(listener: LatencyListener): void;
  
  /**
   * Removes latency listener
   * @param {LatencyListener} listener latency listener to remove
   */
  removeLatencyListener(listener: LatencyListener): void;
  
  /**
   * Adds reconnect listener
   * @param {ReconnectListener} listener reconnect listener to add
   * @param {string} accountId account id of listener
   */
  addReconnectListener(listener: ReconnectListener, accountId: string): void;
  
  /**
   * Removes reconnect listener
   * @param {ReconnectListener} listener listener to remove
   */
  removeReconnectListener(listener: ReconnectListener): void;
  
  /**
   * Removes all listeners. Intended for use in unit tests.
   */
  removeAllListeners(): void;
  
  /**
   * Queues an account packet for processing
   * @param {Object} packet packet to process
   */
  queuePacket(packet: Object): void;
  
  /**
   * Queues account event for processing
   * @param {string} accountId account id
   * @param {string} name event label name
   * @param {Function} callable async or regular function to execute
   */
  queueEvent(accountId: string, name: string, callable: Function): void;

  /**
   * Simulataneously sends RPC requests to all synchronized instances
   * @param {string} accountId metatrader account id
   * @param {Object} request base request data
   * @param {string} [reliability] account reliability
   * @param {Number} [timeoutInSeconds] request timeout in seconds
   */
  rpcRequestAllInstances(aaccountId: string, request: Object, reliability?: string, timeoutInSeconds?: number): Promise<any>;
  
  /**
   * Makes a RPC request
   * @param {string} accountId metatrader account id
   * @param {Object} request base request data
   * @param {number} [timeoutInSeconds] request timeout in seconds
   */
  rpcRequest(accountId: string, request: Object, timeoutInSeconds: number): Promise<any>;
}

/**
 * MetaTrader account information (see https://metaapi.cloud/docs/client/models/metatraderAccountInformation/)
 */
export declare type MetatraderAccountInformation = {

  /**
   * platform id (mt4 or mt5)
   */
  platform: string,

  /**
   * broker name
   */
  broker: string,

  /**
   * account base currency ISO code
   */
  currency: string,

  /**
   * broker server name
   */
  server: string,

  /**
   * account balance
   */
  balance: number,

  /**
   * account liquidation value
   */
  equity: number,

  /**
   * used margin
   */
  margin: number,

  /**
   * free margin
   */
  freeMargin: number,

  /**
   * account leverage coefficient
   */
  leverage: number,

  /**
   * margin level calculated as % of equity/margin
   */
  marginLevel: number,

  /**
   * flag indicating that trading is allowed
   */
  tradeAllowed: boolean,

  /**
   * flag indicating that investor password was used (supported for g2 only)
   */
  investorMode?: boolean,

  /**
   * margin calculation mode, one of ACCOUNT_MARGIN_MODE_EXCHANGE,
   * ACCOUNT_MARGIN_MODE_RETAIL_NETTING, ACCOUNT_MARGIN_MODE_RETAIL_HEDGING
   */
  marginMode: string,

  /**
   * Account owner name
   */
  name: string,

  /**
   * Account login
   */
  login: number,

  /**
   * Account credit in the deposit currency
   */
  credit: number,

  /**
   * Current exchange rate of account currency into account base currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: number

}

/**
 * Stop loss threshold
 */
 export declare type StopLossThreshold = {

  /**
   * Price threshold relative to position open price, interpreted according to units field value
   */
  threshold: number,

  /**
   * Stop loss value, interpreted according to units and basePrice field values
   */
  stopLoss: number
}

/**
 * Threshold trailing stop loss configuration
 */
export declare type ThresholdTrailingStopLoss = {

  /**
   * Stop loss thresholds
   */
  thresholds: StopLossThreshold[],

  /**
   * Threshold stop loss units. ABSOLUTE_PRICE means the that the value of stop loss threshold fields contain a
   * final threshold & stop loss value. RELATIVE* means that the threshold fields value contains relative 
   * threshold & stop loss values, expressed either in price, points, pips, account currency or balance percentage.
   * Default is ABSOLUTE_PRICE. One of ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS,
   * RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  units?: string,

  /**
   * Defined the base price to calculate SL relative to for POSITION_MODIFY and pending order requests. Default
   * is OPEN_PRICE. One of CURRENT_PRICE, OPEN_PRICE
   */
  stopPriceBase?: string
}

/**
 * Distance trailing stop loss configuration
 */
export declare type DistanceTrailingStopLoss = {

  /**
   * SL distance relative to current price, interpreted according to units field value
   */
  distance?: number,

  /**
   * Distance trailing stop loss units. RELATIVE_* means that the distance field value contains relative
   * stop loss expressed either in price, points, pips, account currency or balance percentage. Default is
   * RELATIVE_PRICE. One of RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY,
   * RELATIVE_BALANCE_PERCENTAGE
   */
  units?: string
}

/**
 * Distance trailing stop loss configuration
 */
export declare type TrailingStopLoss = {

  /**
   * Distance trailing stop loss configuration. If both distance and threshold TSL are set, then the
   * resulting SL will be the one which is closest to the current price
   */
  distance?: DistanceTrailingStopLoss

  /**
   * Threshold trailing stop loss configuration. If both distance and threshold TSL are set, then the
   * resulting SL will be the one which is closest to the current price
   */
  threshold?: ThresholdTrailingStopLoss
}

/**
 * MetaTrader position
 */
export declare type MetatraderPosition = {

  /**
   * position id (ticket number)
   */
  id: number,

  /**
   * position type (one of POSITION_TYPE_BUY, POSITION_TYPE_SELL)
   */
  type: string,

  /**
   * position symbol
   */
  symbol: string,

  /**
   * position magic number, identifies the EA which opened the position
   */
  magic: number,

  /**
   * time position was opened at
   */
  time: Date,

  /**
   * time position was opened at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * last position modification time
   */
  updateTime: Date,

  /**
   * position open price
   */
  openPrice: number,

  /**
   * current price
   */
  currentPrice: number,

  /**
   * current tick value
   */
  currentTickValue: number,

  /**
   * optional position stop loss price
   */
  stopLoss?: number,

  /**
   * optional position take profit price
   */
  takeProfit?: number,

  /**
   * position volume
   */
  volume: number,

  /**
   * position cumulative swap, including both swap from currently open position part (unrealized
   * swap) and swap from partially closed position part (realized swap)
   */
  swap: number,

  /**
   * swap from partially closed position part
   */
  realizedSwap: number,

  /**
   * swap resulting from currently open position part
   */
  unrealizedSwap: number,

  /**
   * position cumulative profit, including unrealized profit resulting from currently open position part (except swap
   * and commissions) and realized profit resulting from partially closed position part and including swap and
   * commissions
   */
  profit: number,

  /**
   * optional position comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   */
  comment?: string,

  /**
   * optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   */
  clientId?: string,

  /**
   * profit of the part of the position which is not yet closed, excluding swap and commissions
   */
  unrealizedProfit: number,

  /**
   * profit of the already closed part, including commissions and swap (realized and unrealized)
   */
  realizedProfit: number,

  /**
   * total position commissions, resulting both from currently open and closed position parts
   */
  commission: number,

  /**
   * position realized commission, resulting from partially closed position part
   */
  realizedCommission: number,

  /**
   * position unrealized commission, resulting from currently open position part
   */
  unrealizedCommission: number,

  /**
   * position opening reason. One of POSITION_REASON_CLIENT, POSITION_REASON_EXPERT,
   * POSITION_REASON_MOBILE, POSITION_REASON_WEB, POSITION_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/positionproperties#enum_position_reason',
   */
  reason: string,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: number,

  /**
   * current comment value on broker side (possibly overriden by the broker)
   */
  brokerComment?: string
}

/**
 * MetaTrader order
 */
export declare type MetatraderOrder = {

  /**
   * order id (ticket number)
   */
  id: number,

  /**
   * order type (one of ORDER_TYPE_SELL, ORDER_TYPE_BUY, ORDER_TYPE_BUY_LIMIT,
   * ORDER_TYPE_SELL_LIMIT, ORDER_TYPE_BUY_STOP, ORDER_TYPE_SELL_STOP). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type
   */
  type: string,

  /**
   * order state one of (ORDER_STATE_STARTED, ORDER_STATE_PLACED, ORDER_STATE_CANCELED,
   * ORDER_STATE_PARTIAL, ORDER_STATE_FILLED, ORDER_STATE_REJECTED, ORDER_STATE_EXPIRED, ORDER_STATE_REQUEST_ADD,
   * ORDER_STATE_REQUEST_MODIFY, ORDER_STATE_REQUEST_CANCEL). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_state
   */
  state: string,

  /**
   * order magic number, identifies the EA which created the order
   */
  magic: number,

  /**
   * time order was created at
   */
  time: Date,

  /**
   * time time order was created at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * time order was executed or canceled at. Will be specified for
   * completed orders only
   */
  doneTime?: Date,

  /**
   * time order was executed or canceled at, in broker timezone,
   * YYYY-MM-DD HH:mm:ss.SSS format. Will be specified for completed orders only
   */
  doneBrokerTime?: string,

  /**
   * order symbol
   */
  symbol: string,

  /**
   * order open price (market price for market orders, limit price for limit orders or stop
   * price for stop orders)
   */
  openPrice: number,

  /**
   * current price, filled for pending orders only. Not filled for history orders.
   */
  currentPrice?: number,

  /**
   * order stop loss price
   */
  stopLoss?: number,

  /**
   * order take profit price
   */
  takeProfit?: number,

  /**
   * order requested quantity
   */
  volume: number,

  /**
   * order remaining quantity, i.e. requested quantity - filled quantity
   */
  currentVolume: number,

  /**
   * order position id. Present only if the order has a position attached to it
   */
  positionId: string,

  /**
   * order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   */
  comment?: string,

  /**
   * current comment value on broker side (possibly overriden by the broker)
   */
  brokerComment?: string,

  /**
   * client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   */
  clientId?: string,

  /**
   * platform id (mt4 or mt5)
   */
  platform: string,

  /**
   * order opening reason. One of ORDER_REASON_CLIENT, ORDER_REASON_MOBILE, ORDER_REASON_WEB,
   * ORDER_REASON_EXPERT, ORDER_REASON_SL, ORDER_REASON_TP, ORDER_REASON_SO, ORDER_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_reason.
   */
  reason: string,

  /**
   * order filling mode. One of ORDER_FILLING_FOK, ORDER_FILLING_IOC,
   * ORDER_FILLING_RETURN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling.
   */
  fillingMode: string,

  /**
   * order expiration type. One of ORDER_TIME_GTC, ORDER_TIME_DAY,
   * ORDER_TIME_SPECIFIED, ORDER_TIME_SPECIFIED_DAY. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_time
   */
  expirationType: string,

  /**
   * optional order expiration time
   */
  expirationTime: Date,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: number,

  /**
   * identifier of an opposite position used for closing by order
   * ORDER_TYPE_CLOSE_BY
   */
  closeByPositionId?: string,

  /**
   * the Limit order price for the StopLimit order
   */
  stopLimitPrice?: number
}

/**
 * MetaTrader history orders search query response
 */
export declare type MetatraderHistoryOrders = {

  /**
   * array of history orders returned
   */
  historyOrders: Array<MetatraderOrder>,

  /**
   * flag indicating that history order initial synchronization is still in progress
   * and thus search results may be incomplete
   */
  synchronizing: boolean
}

/**
 * MetaTrader history deals search query response
 */
export declare type MetatraderDeals = {

  /**
   * array of history deals returned
   */
  deals: Array<MetatraderDeal>,

  /**
   * flag indicating that deal initial synchronization is still in progress
   * and thus search results may be incomplete
   */
  synchronizing: boolean
}

/**
 * MetaTrader deal
 */
export declare type MetatraderDeal = {

  /**
   * deal id (ticket number)
   */
  id: string,

  /**
   * deal type (one of DEAL_TYPE_BUY, DEAL_TYPE_SELL, DEAL_TYPE_BALANCE, DEAL_TYPE_CREDIT,
   * DEAL_TYPE_CHARGE, DEAL_TYPE_CORRECTION, DEAL_TYPE_BONUS, DEAL_TYPE_COMMISSION, DEAL_TYPE_COMMISSION_DAILY,
   * DEAL_TYPE_COMMISSION_MONTHLY, DEAL_TYPE_COMMISSION_AGENT_DAILY, DEAL_TYPE_COMMISSION_AGENT_MONTHLY,
   * DEAL_TYPE_INTEREST, DEAL_TYPE_BUY_CANCELED, DEAL_TYPE_SELL_CANCELED, DEAL_DIVIDEND, DEAL_DIVIDEND_FRANKED,
   * DEAL_TAX). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_type
   */
  type: string,

  /**
   * deal entry type (one of DEAL_ENTRY_IN, DEAL_ENTRY_OUT, DEAL_ENTRY_INOUT,
   * DEAL_ENTRY_OUT_BY). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_entry
   */
  entryType: string,

  /**
   * symbol deal relates to
   */
  symbol?: string,

  /**
   * deal magic number, identifies the EA which initiated the deal
   */
  magic?: number,

  /**
   * time the deal was conducted at
   */
  time: Date,

  /**
   * time time the deal was conducted at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * deal volume
   */
  volume?: number,

  /**
   * the price the deal was conducted at
   */
  price?: number,

  /**
   * deal commission
   */
  commission?: number,

  /**
   * deal swap
   */
  swap?: number,

  /**
   * deal profit
   */
  profit: number,

  /**
   * id of position the deal relates to
   */
  positionId?: string,

  /**
   * id of order the deal relates to
   */
  orderId?: string,

  /**
   * deal comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   */
  comment?: string,

  /**
   * current comment value on broker side (possibly overriden by the broker)
   */
  brokerComment?: string,

  /**
   * client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   */
  clientId: string,

  /**
   * platform id (mt4 or mt5)
   */
  platform: string,

  /**
   * optional deal execution reason. One of DEAL_REASON_CLIENT, DEAL_REASON_MOBILE,
   * DEAL_REASON_WEB, DEAL_REASON_EXPERT, DEAL_REASON_SL, DEAL_REASON_TP, DEAL_REASON_SO, DEAL_REASON_ROLLOVER,
   * DEAL_REASON_VMARGIN, DEAL_REASON_SPLIT, DEAL_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_reason.
   */
  reason?: string,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: number,

  /**
   * deal stop loss. For MT5 opening deal this is the SL of the order opening the
   * position. For MT4 deals or MT5 closing deal this is the last known position SL.
   */
  stopLoss?: number,

  /**
   * deal take profit. For MT5 opening deal this is the TP of the order opening the
   * position. For MT4 deals or MT5 closing deal this is the last known position TP.
   */
  takeProfit?: number
}

/**
 * MetaTrader trade response
 */
export declare type MetatraderTradeResponse = {

  /**
   * numeric response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are 0, 10008-10010, 10025. The rest
   * codes are errors
   */
  numericCode: number,

  /**
   * string response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are ERR_NO_ERROR,
   * TRADE_RETCODE_PLACED, TRADE_RETCODE_DONE, TRADE_RETCODE_DONE_PARTIAL, TRADE_RETCODE_NO_CHANGES. The rest codes are
   * errors.
   */
  stringCode: string,

  /**
   * human-readable response message
   */
  message: string,

  /**
   * order id which was created/modified during the trade
   */
  orderId: string,

  /**
   * position id which was modified during the trade
   */
  positionId: string
}

/**
 * Market data subscription
 */
export declare type MarketDataSubscription = {

  /**
   * subscription type, one of quotes, candles, ticks, or marketDepth
   */
  type: string,

  /**
   * when subscription type is candles, defines the timeframe according to which the
   * candles must be generated. Allowed values for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h,
   * 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   */
  timeframe?: string,

  /**
   * defines how frequently the terminal will stream data to client. If not
   * set, then the value configured in account will be used
   */
  intervalInMilliseconds?: number
}

/**
 * Market data unsubscription
 */
export declare type MarketDataUnsubscription = {

  /**
   * subscription type, one of quotes, candles, ticks, or marketDepth
   */
  type: string
}

/**
 * MetaTrader symbol specification. Contains symbol specification (see
 * https://metaapi.cloud/docs/client/models/metatraderSymbolSpecification/)
 */
export declare type MetatraderSymbolSpecification = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: string,

  /**
   * tick size
   */
  tickSize: number,

  /**
   * minimum order volume for the symbol
   */
  minVolume: number,

  /**
   * maximum order volume for the symbol
   */
  maxVolume: number,

  /**
   * order volume step for the symbol
   */
  volumeStep: number,

  /**
   * of allowed order filling modes. Can contain ORDER_FILLING_FOK, ORDER_FILLING_IOC or
   * both. See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_filling_mode for more
   * details.
   */
  list: Array<string>,

  /**
   * execution mode. Possible values are SYMBOL_TRADE_EXECUTION_REQUEST,
   * SYMBOL_TRADE_EXECUTION_INSTANT, SYMBOL_TRADE_EXECUTION_MARKET, SYMBOL_TRADE_EXECUTION_EXCHANGE. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_execution for more
   * details.
   */
  deal: string,

  /**
   * trade contract size
   */
  contractSize: number,

  /**
   * quote sessions, indexed by day of week
   */
  quoteSessions: MetatraderSessions,

  /**
   * trade sessions, indexed by day of week
   */
  tradeSessions: MetatraderSessions,

  /**
   * order execution type. Possible values are SYMBOL_TRADE_MODE_DISABLED,
   * SYMBOL_TRADE_MODE_LONGONLY, SYMBOL_TRADE_MODE_SHORTONLY, SYMBOL_TRADE_MODE_CLOSEONLY, SYMBOL_TRADE_MODE_FULL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_mode for more
   * details
   */
  tradeMode?: string,

  /**
   * accrued interest – accumulated coupon interest, i.e. part of the coupon
   * interest calculated in proportion to the number of days since the coupon bond issuance or the last coupon interest
   * payment
   */
  bondAccruedInterest?: number,

  /**
   * face value – initial bond value set by the issuer
   */
  bondFaceValue?: number,

  /**
   * the strike price of an option. The price at which an option buyer can buy (in a
   * Call option) or sell (in a Put option) the underlying asset, and the option seller is obliged to sell or buy the
   * appropriate amount of the underlying asset.
   */
  optionStrike?: number,

  /**
   * option/warrant sensitivity shows by how many points the price of the
   * option's underlying asset should change so that the price of the option changes by one point
   */
  optionPriceSensivity?: number,

  /**
   * liquidity Rate is the share of the asset that can be used for the margin
   */
  liquidityRate?: number,

  /**
   * initial margin means the amount in the margin currency required for opening a
   * position with the volume of one lot. It is used for checking a client's assets when he or she enters the market
   */
  initialMargin: number,

  /**
   * the maintenance margin. If it is set, it sets the margin amount in the margin
   * currency of the symbol, charged from one lot. It is used for checking a client's assets when his/her account state
   * changes. If the maintenance margin is equal to 0, the initial margin is used
   */
  maintenanceMargin: number,

  /**
   * contract size or margin value per one lot of hedged positions (oppositely directed
   * positions of one symbol). Two margin calculation methods are possible for hedged positions. The calculation method
   * is defined by the broker
   */
  hedgedMargin: number,

  /**
   * calculating hedging margin using the larger leg (Buy or Sell)
   */
  hedgedMarginUsesLargerLeg?: boolean,

  /**
   * margin currency
   */
  marginCurrency: string,

  /**
   * contract price calculation mode. One of SYMBOL_CALC_MODE_UNKNOWN,
   * SYMBOL_CALC_MODE_FOREX, SYMBOL_CALC_MODE_FOREX_NO_LEVERAGE, SYMBOL_CALC_MODE_FUTURES, SYMBOL_CALC_MODE_CFD,
   * SYMBOL_CALC_MODE_CFDINDEX, SYMBOL_CALC_MODE_CFDLEVERAGE, SYMBOL_CALC_MODE_EXCH_STOCKS,
   * SYMBOL_CALC_MODE_EXCH_FUTURES, SYMBOL_CALC_MODE_EXCH_FUTURES_FORTS, SYMBOL_CALC_MODE_EXCH_BONDS,
   * SYMBOL_CALC_MODE_EXCH_STOCKS_MOEX, SYMBOL_CALC_MODE_EXCH_BONDS_MOEX, SYMBOL_CALC_MODE_SERV_COLLATERAL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_calc_mode for more details
   */
  priceCalculationMode: string,

  /**
   * base currency
   */
  baseCurrency: string,

  /**
   * profit currency
   */
  profitCurrency?: string,

  /**
   * swap calculation model. Allowed values are SYMBOL_SWAP_MODE_DISABLED,
   * SYMBOL_SWAP_MODE_POINTS, SYMBOL_SWAP_MODE_CURRENCY_SYMBOL, SYMBOL_SWAP_MODE_CURRENCY_MARGIN,
   * SYMBOL_SWAP_MODE_CURRENCY_DEPOSIT, SYMBOL_SWAP_MODE_INTEREST_CURRENT, SYMBOL_SWAP_MODE_INTEREST_OPEN,
   * SYMBOL_SWAP_MODE_REOPEN_CURRENT, SYMBOL_SWAP_MODE_REOPEN_BID. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_swap_mode for more details
   */
  swapMode: string,

  /**
   * long swap value
   */
  swapLong?: number,

  /**
   * short swap value
   */
  swapShort?: number,

  /**
   * day of week to charge 3 days swap rollover. Allowed values are SUNDAY,
   * MONDAY, TUESDAY, WEDNESDAY, THURDAY, FRIDAY, SATURDAY, NONE
   */
  swapRollover3Days?: string,

  /**
   * allowed order expiration modes. Allowed values are
   * SYMBOL_EXPIRATION_GTC, SYMBOL_EXPIRATION_DAY, SYMBOL_EXPIRATION_SPECIFIED, SYMBOL_EXPIRATION_SPECIFIED_DAY.
   * See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_expiration_mode for more
   * details
   */
  allowedExpirationModes: Array<string>,

  /**
   * allowed order types. Allowed values are SYMBOL_ORDER_MARKET,
   * SYMBOL_ORDER_LIMIT, SYMBOL_ORDER_STOP, SYMBOL_ORDER_STOP_LIMIT, SYMBOL_ORDER_SL, SYMBOL_ORDER_TP,
   * SYMBOL_ORDER_CLOSEBY. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_order_mode for more details
   */
  allowedOrderTypes: Array<string>,

  /**
   * if the expirationMode property is set to SYMBOL_EXPIRATION_GTC (good till
   * canceled), the expiration of pending orders, as well as of Stop Loss/Take Profit orders should be additionally set
   * using this enumeration. Allowed values are SYMBOL_ORDERS_GTC, SYMBOL_ORDERS_DAILY,
   * SYMBOL_ORDERS_DAILY_EXCLUDING_STOPS. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_order_gtc_mode for more
   * details
   */
  orderGTCMode: string,

  /**
   * digits after a decimal point
   */
  digits: number,

  /**
   * point size
   */
  point: number,

  /**
   * path in the symbol tree
   */
  path?: string,

  /**
   * symbol description
   */
  description: string,

  /**
   * date of the symbol trade beginning (usually used for futures)
   */
  startTime?: Date,

  /**
   * date of the symbol trade end (usually used for futures)
   */
  expirationTime?: Date,

  /**
   * size of a pip. Pip size is defined for spot and CFD symbols only
   */
  pipSize?: number,

  /**
   * minimal indention in points from the current close price to place Stop orders
   */
  stopsLevel: number,

  /**
   * distance to freeze trade operations in points
   */
  freezeLevel: number

}

/**
 * MetaTrader symbol price. Contains current price for a symbol (see
 * https://metaapi.cloud/docs/client/models/metatraderSymbolPrice/)
 */
export declare type MetatraderSymbolPrice = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: string,

  /**
   * bid price
   */
  bid: string,

  /**
   * ask price
   */
  ask: number,

  /**
   * tick value for a profitable position
   */
  profitTickValue: number,

  /**
   * tick value for a losing position
   */
  lossTickValue: number,

  /**
   * current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   */
  accountCurrencyExchangeRate?: number,

  /**
   * quote time, in ISO format
   */
  time: Date,

  /**
   * time quote time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string
}

/**
 * MetaTrader candle
 */
export declare type MetatraderCandle = {

  /**
   * symbol (e.g. currency pair or an index)
   */
  symbol: string,

  /**
   * timeframe candle was generated for, e.g. 1h. One of 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m,
   * 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn
   */
  timeframe: string,

  /**
   * candle opening time
   */
  time: Date,

  /**
   * candle opening time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * open price
   */
  open: number,

  /**
   * high price
   */
  high: number,

  /**
   * low price
   */
  low: number,

  /**
   * close price
   */
  close: number,

  /**
   * tick volume, i.e. number of ticks inside the candle
   */
  tickVolume: number,

  /**
   * spread in points
   */
  spread: number,

  /**
   * trade volume
   */
  volume: number
}

/**
 * MetaTrader tick data
 */
export declare type MetatraderTick = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: string,

  /**
   * time
   */
  time: Date,

  /**
   * time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * bid price
   */
  bid?: number,

  /**
   * ask price
   */
  ask?: number,

  /**
   * last deal price
   */
  last?: number,

  /**
   * volume for the current last deal price
   */
  volume?: number,

  /**
   * is tick a result of buy or sell deal, one of buy or sell
   */
  side: string
}

/**
 * MetaTrader order book
 */
export declare type MetatraderBook = {

  /**
   * symbol (e.g. a currency pair or an index)
   */
  symbol: string,

  /**
   * time
   */
  time: Date,

  /**
   * time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * list of order book entries
   */
  book: Array<MetatraderBookEntry>
}

/**
 *  MetaTrader trade
 */
export declare type MetatraderTrade = {

  /**
   * type, enum: ORDER_TYPE_SELL, ORDER_TYPE_BUY, ORDER_TYPE_BUY_LIMIT, ORDER_TYPE_SELL_LIMIT,ORDER_TYPE_BUY_STOP, ORDER_TYPE_SELL_STOP, POSITION_MODIFY, POSITION_PARTIAL, POSITION_CLOSE_ID,POSITIONS_CLOSE_SYMBOL, ORDER_MODIFY, ORDER_CANCEL, POSITION_CLOSE_BY, ORDER_TYPE_BUY_STOP_LIMIT, ORDER_TYPE_SELL_STOP_LIMIT.
   */
  actionType: string,

  /**
   * symbol to trade
   */
  symbol?: string,

  /**
   * order volume
   */
  volume?: number,

  /**
   * order limit or stop price
   */
  openPrice?: number,

  /**
   * stop loss price
   */
  stopLoss?: number,

  /**
   * take profit price
   */
  takeProfit?: number,

  /**
   * stop loss units. ABSOLUTE_PRICE means the that the value of stopLoss field is a final stop loss value. RELATIVE_* means that the stopLoss field value contains relative stop loss expressed either in price, points, account currency or balance percentage. Default is ABSOLUTE_PRICE. enum: ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  stopLossUnits?: string,

  /**
   * take profit units. ABSOLUTE_PRICE means the that the value of takeProfit field is a final take profit value. RELATIVE_* means that the takeProfit field value contains relative take profit expressed either in price, points, account currency or balance percentage. Default is ABSOLUTE_PRICE. enum: ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   */
  takeProfitUnits?: string,

  /**
   * order id, must be specified for order modification commands
   */
  orderId?: string,

  /**
   * position id, must be specified for position modification commands
   */
  positionId?: string,

  /**
   * order comment. The sum of the line lengths of the comment and the clientId must be less than or equal to 26. For more information see clientId usage
   */
  comment?: string,

  /**
   * client-assigned id. The id value can be assigned when submitting a trade and will be present on position, history orders and history deals related to the trade. You can use this field to bind your trades to objects in your application and then track trade progress. The sum of the line lengths of the comment and the clientId must be less than or equal to 26. For more information see clientId usage
   */
  clientId?: string,

  /**
   * magic number (expert adviser id)
   */
  magic?: number,

  /**
   * slippage in points. Should be greater or equal to zero. In not set, default value specified in account entity will be used. Slippage is ignored on position modification, order modification and order cancellation calls. Slippage is also ignored if execution mode set in symbol specification is SYMBOL_TRADE_EXECUTION_MARKET.
   */
  slippage?: number,

  /**
   * allowed filling modes in the order of priority. Default is to allow all filling modes and prefer ORDER_FILLING_FOK over ORDER_FILLING_IOC. See https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling for extra explanation.
   */
  fillingModes?: Array<any>,

  /**
   * pending order expiration settings. See Pending order expiration settings section.
   */
  expiration?: Object,

  /**
   * identifier of an opposite position used for closing by order, required in case actionType is POSITION_CLOSE_BY
   */
  closeByPositionId?: string,

  /**
   * optional price at which the StopLimit order will be placed. Required for stop limit orders
   */
  stopLimitPrice: string
}

/**
 * Metatrader trade or quote session
 */
export declare type MetatraderSession = {

  /**
   * session start time, in hh.mm.ss.SSS format
   */
  from: string,

  /**
   * session end time, in hh.mm.ss.SSS format
   */
  to: string
}

/**
 * Metatrader trade or quote session container, indexed by weekday
 */
export declare type MetatraderSessions = {

  /**
   * array of sessions for SUNDAY
   */
  SUNDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for MONDAY
   */
  MONDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for TUESDAY
   */
  TUESDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for WEDNESDAY
   */
  WEDNESDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for THURSDAY
   */
  THURSDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for FRIDAY
   */
  FRIDAY?: Array<MetatraderSession>,

  /**
   * array of sessions for SATURDAY
   */
  SATURDAY?: Array<MetatraderSession>
}

/**
 * MetaTrader order book entry
 */
export declare type MetatraderBookEntry = {

  /**
   * entry type, one of BOOK_TYPE_SELL, BOOK_TYPE_BUY, BOOK_TYPE_SELL_MARKET,
   * BOOK_TYPE_BUY_MARKET
   */
  type: string,

  /**
   * price
   */
  price: number,

  /**
   * volume
   */
  volume: number
}

/**
 * Current server time (see https://metaapi.cloud/docs/client/models/serverTime/)
 */
export declare type ServerTime = {

  /**
   * Current server time
   */
  time: Date,

  /**
   * Current broker time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string,

  /**
   * Last quote time
   */
  lastQuoteTime?: Date,

  /**
   * Last quote time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  lastQuoteBrokerTime?: string

}

/**
 * Margin required to open a trade (see https://metaapi.cloud/docs/client/models/margin/)
 */
export declare type Margin = {

  /**
   * Margin required to open a trade. If margin can not be calculated, then this field is not defined
   */
  margin?: number

}

/**
 * Contains order to calculate margin for (see https://metaapi.cloud/docs/client/models/marginOrder/)
 */
export declare type MarginOrder = {

    /**
     * Order symbol
     */
    symbol: string,

    /**
     * Order type, one of ORDER_TYPE_BUY or ORDER_TYPE_SELL
     */
    type: string,

    /**
     * Order volume, must be greater than 0
     */
    volume: number,

    /**
     * Order open price, must be greater than 0
     */
    openPrice: number

}
