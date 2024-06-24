import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import MetatraderAccount from "./metatraderAccount";
import HistoryStorage from "./historyStorage";
import ConnectionRegistry from "./connectionRegistry";
import { RefreshSubscriptionsOpts } from "./metaApi";
import { MarketDataSubscription, MarketDataUnsubscription } from "../clients/metaApi/metaApiWebsocket.client";
import TerminalState from "./terminalState";
import ConnectionHealthMonitor from "./connectionHealthMonitor";
import MetaApiConnection from "./metaApiConnection";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";
import ClientApiClient from "../clients/metaApi/clientApi.client";

/**
 * Exposes MetaApi MetaTrader streaming API connection to consumers
 */
export default class StreamingMetaApiConnection extends MetaApiConnection {
  
  /**
   * Constructs MetaApi MetaTrader streaming Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client api client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage. By default an instance of MemoryHistoryStorage
   * will be used.
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {Date} [historyStartTime] history start sync time
   * @param {RefreshSubscriptionsOpts} [refreshSubscriptionsOpts] subscriptions refresh options
   */
  constructor(websocketClient: MetaApiWebsocketClient, clientApiClient: ClientApiClient, account: MetatraderAccount, historyStorage: HistoryStorage, connectionRegistry: ConnectionRegistry,
    historyStartTime?: Date, refreshSubscriptionsOpts?: RefreshSubscriptionsOpts);
  
  /**
   * Clears the order and transaction history of a specified application and removes application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @return {Promise} promise resolving when the history is cleared and application is removed
   */
  removeApplication(): Promise<any>;
  
  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/)
   * @param {string} instanceIndex instance index
   * @returns {Promise} promise which resolves when synchronization started
   */
  synchronize(instanceIndex: string): Promise<any>;
  
  /**
   * Initializes meta api connection
   * @return {Promise} promise which resolves when meta api connection is initialized
   */
  initialize(): Promise<any>;
  
  /**
   * Initiates subscription to MetaTrader terminal
   * @returns {Promise} promise which resolves when subscription is initiated
   */
  subscribe(): Promise<any>;
  
  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update. Please
   * note that this feature is not fully implemented on server-side yet
   * @param {number} [timeoutInSeconds] timeout to wait for prices in seconds, default is 30
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(symbol: string, subscriptions: Array<MarketDataSubscription>, timeoutInSeconds?: number): Promise<any>;
  
  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(symbol: string, subscriptions: MarketDataUnsubscription): Promise<any>;
  
  /**
   * Invoked when subscription downgrade has occurred
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSubscriptionDowngraded(instanceIndex: string, symbol: string, updates: Array<MarketDataSubscription>, unsubscriptions: Array<MarketDataUnsubscription>): Promise<any>;
  
  /**
   * Returns list of the symbols connection is subscribed to
   * @returns {Array<string>} list of the symbols connection is subscribed to
   */
  get subscribedSymbols(): Array<string>;
  
  /**
   * Returns subscriptions for a symbol
   * @param {string} symbol symbol to retrieve subscriptions for
   * @returns {Array<MarketDataSubscription>} list of market data subscriptions for the symbol
   */
  subscriptions(symbol: string): Array<MarketDataSubscription>;
  
  /**
   * Sends client uptime stats to the server.
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(uptime: Object): Promise<any>;
  
  /**
   * Returns local copy of terminal state
   * @returns {TerminalState} local copy of terminal state
   */
  get terminalState(): TerminalState;
  
  /**
   * Returns local history storage
   * @returns {HistoryStorage} local history storage
   */
  get historyStorage(): HistoryStorage;
  
  /**
   * Adds synchronization listener
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(listener: SynchronizationListener): void;
  
  /**
   * Removes synchronization listener for specific account
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(listener: SynchronizationListener): void;
  
  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {string} instanceIndex index of an account instance connected
   * @param {number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onConnected(instanceIndex: string, replicas: number): Promise<any>;
  
  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {string} instanceIndex index of an account instance connected
   */
  onDisconnected(instanceIndex: string): Promise<any>;
  
  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealsSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrdersSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect
   * @param {string} region reconnected region
   * @param {number} instanceNumber reconnected instance number
   * @return {Promise} promise which resolves when connection to MetaApi websocket API restored after a disconnect
   */
  onReconnected(region: string, instanceNumber: number): Promise<any>;
  
  /**
   * Invoked when a stream for an instance index is closed
   * @param {string} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onStreamClosed(instanceIndex: string): Promise<any>;
  
  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {string} instanceIndex index of an account instance connected
   * @param {boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted(instanceIndex: string, specificationsUpdated: boolean, positionsUpdated: boolean, ordersUpdated: boolean): Promise<any>;
  
  /**
   * Invoked when account region has been unsubscribed
   * @param {string} region account region unsubscribed
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onUnsubscribeRegion(region: string): Promise<any>;

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId optional synchronization request id, last synchronization request id will be used
   * by default
   * @return {Promise<boolean>} promise resolving with a flag indicating status of state synchronization with MetaTrader
   * terminal
   */
  isSynchronized(instanceIndex: string, synchronizationId: string): Promise<boolean>;
  
  /**
   * Waits until synchronization to MetaTrader terminal is completed
   * @param {SynchronizationOptions} synchronization options
   * @return {Promise} promise which resolves when synchronization to MetaTrader terminal is completed
   */
  waitSynchronized(opts: SynchronizationOptions): Promise<any>;
  
  /**
   * Queues an event for processing among other synchronization events within same account
   * @param {String} name event label name
   * @param {Function} callable async or regular function to execute
   */
  queueEvent(name: string, callable: Function): void;

  /**
   * Returns synchronization status
   * @return {boolean} synchronization status
   */
  get synchronized(): boolean;
  
  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account(): MetatraderAccount;
  
  /**
   * Returns connection health monitor instance
   * @return {ConnectionHealthMonitor} connection health monitor instance
   */
  get healthMonitor(): ConnectionHealthMonitor;
}

/**
 * Synchronization options
 */
export declare type SynchronizationOptions = {

  /**
   * application regular expression pattern, default is .*
   */
  applicationPattern?: string,

  /**
   * synchronization id, last synchronization request id will be used by
   * default
   */
  synchronizationId?: string,

  /**
   * index of an account instance to ensure synchronization on, default is to wait
   * for the first instance to synchronize
   */
  instanceIndex?: number,

  /**
   * wait timeout in seconds, default is 5m
   */
  timeoutInSeconds?: number,

  /**
   * interval between account reloads while waiting for a change, default is 1s
   */
  intervalInMilliseconds?: number
}