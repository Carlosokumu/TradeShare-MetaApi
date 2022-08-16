import { MetatraderAccountInformation, MetatraderOrder, MetatraderPosition, MetatraderSymbolPrice, MetatraderSymbolSpecification } from "../clients/metaApi/metaApiWebsocket.client";
import ClientApiClient from "../clients/metaApi/clientApi.client";
import SynchronizationListener from "../clients/metaApi/synchronizationListener";

/**
 * Responsible for storing a local copy of remote terminal state
 */
export default class TerminalState extends SynchronizationListener {
  
  /**
   * Constructs the instance of terminal state class
   * @param {string} accountId account id
   * @param {ClientApiClient} clientApiClient client API client
   */
  constructor(accountId: string, clientApiClient: ClientApiClient);
  
  /**
   * Returns true if MetaApi have connected to MetaTrader terminal
   * @return {boolean} true if MetaApi have connected to MetaTrader terminal
   */
  get connected(): boolean;
  
  /**
   * Returns true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to broker
   * @return {boolean} true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to
   * broker
   */
  get connectedToBroker(): boolean;
  
  /**
   * Returns a local copy of account information
   * @returns {MetatraderAccountInformation} local copy of account information
   */
  get accountInformation(): MetatraderAccountInformation;
  
  /**
   * Returns a local copy of MetaTrader positions opened
   * @returns {Array<MetatraderPosition>} a local copy of MetaTrader positions opened
   */
  get positions(): Array<MetatraderPosition>;
  
  /**
   * Returns a local copy of MetaTrader orders opened
   * @returns {Array<MetatraderOrder>} a local copy of MetaTrader orders opened
   */
  get orders(): Array<MetatraderOrder>;
  
  /**
   * Returns a local copy of symbol specifications available in MetaTrader trading terminal
   * @returns {Array<MetatraderSymbolSpecification>} a local copy of symbol specifications available in MetaTrader
   * trading terminal
   */
  get specifications(): Array<MetatraderSymbolSpecification>;
  
  /**
   * Returns hashes of terminal state data for incremental synchronization
   * @param {string} accountType account type
   * @param {string} instanceIndex index of instance to get hashes of
   * @returns {Promise<Object>} promise resolving with hashes of terminal state data
   */
  getHashes(accountType: string, instanceIndex: string): Promise<Object>;
  
  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol: string): MetatraderSymbolSpecification;
  
  /**
   * Returns MetaTrader symbol price by symbol
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol: string): MetatraderSymbolPrice;

  /**
   * Returns time of the last received quote
   * @return {QuoteTime} time of the last received quote
   */
  get lastQuoteTime(): QuoteTime;

  /**
   * Waits for price to be received
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {number} [timeoutInSeconds] timeout in seconds, default is 30
   * @return {Promise<MetatraderSymbolPrice>} promise resolving with price or undefined if price has not been received
   */
  waitForPrice(symbol: string, timeoutInSeconds?: number): Promise<MetatraderSymbolPrice>;
  
  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {string} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex: string): Promise<any>;
  
  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {string} instanceIndex index of an account instance connected
   */
  onDisconnected(instanceIndex: string): Promise<any>;
  
  /**
   * Invoked when broker connection status have changed
   * @param {string} instanceIndex index of an account instance connected
   * @param {boolean} connected is MetaTrader terminal is connected to broker
   */
  onBrokerConnectionStatusChanged(instanceIndex: string, connected: boolean): Promise<any>;
  
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
   * Invoked when MetaTrader account information is updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(instanceIndex: string, accountInformation: MetatraderAccountInformation): Promise<any>;
  
  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex: string, positions: Array<MetatraderPosition>): Promise<any>;
  
  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when MetaTrader position is updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   */
  onPositionUpdated(instanceIndex: string, position: MetatraderPosition): Promise<any>;
  
  /**
   * Invoked when MetaTrader position is removed
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} positionId removed MetaTrader position id
   */
  onPositionRemoved(instanceIndex: string, positionId: string): Promise<any>;
  
  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex: string, orders: Array<MetatraderOrder>): Promise<any>;
  
  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when MetaTrader pending order is updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader pending order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderUpdated(instanceIndex: string, order: MetatraderOrder): Promise<any>;
 
  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} orderId completed MetaTrader pending order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderCompleted(instanceIndex: string, orderId: string): Promise<any>;
  
  /**
   * Invoked when a symbol specification was updated
   * @param {string} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<string>} removedSymbols removed symbols
   */
  onSymbolSpecificationsUpdated(instanceIndex: string, specifications: Array<MetatraderSymbolSpecification>, removedSymbols: Array<string>): Promise<any>;
  
  /**
   * Invoked when prices for several symbols were updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {number} equity account liquidation value
   * @param {number} margin margin used
   * @param {number} freeMargin free margin
   * @param {number} marginLevel margin level calculated as % of equity/margin
   */
  onSymbolPricesUpdated(instanceIndex: string, prices: Array<MetatraderSymbolPrice>, equity: number, margin: number, freeMargin: number, marginLevel: number): Promise<any>;
  
  /**
   * Invoked when a stream for an instance index is closed
   * @param {string} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onStreamClosed(instanceIndex: string): Promise<any>;  
}

/**
 * Quote time
 */
export declare type QuoteTime = {

  /**
   * Quote time
   */
  time: Date,

  /**
   * Quote broker time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */
  brokerTime: string

}