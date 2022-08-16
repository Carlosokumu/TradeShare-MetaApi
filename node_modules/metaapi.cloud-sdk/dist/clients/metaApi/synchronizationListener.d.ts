import { MarketDataSubscription, MarketDataUnsubscription, MetatraderAccountInformation, MetatraderBook, MetatraderTick, MetatraderCandle, MetatraderSymbolPrice, MetatraderSymbolSpecification, MetatraderDeal, MetatraderOrder, MetatraderPosition } from "./metaApiWebsocket.client"

/**
 * Defines interface for a synchronization listener class
 */
export default class SynchronizationListener {
  
  /**
   * Returns instance number of instance index
   * @param {string} instanceIndex instance index
   */
  getInstanceNumber(instanceIndex: string): number | undefined;
  
  /**
   * Returns host name of instance index
   * @param {string} instanceIndex instance index
   */
  getHostName(instanceIndex: string): string | undefined;
  
  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {string} instanceIndex index of an account instance connected
   * @param {number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onConnected(instanceIndex: string, replicas: number): Promise<any>;
  
  /**
   * Invoked when a server-side application health status is received from MetaApi
   * @param {string} instanceIndex index of an account instance connected
   * @param {HealthStatus} status server-side application health status
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHealthStatus(instanceIndex: string, status: HealthStatus): Promise<any>;
  
  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {string} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDisconnected(instanceIndex: string): Promise<any>;
  
  /**
   * Invoked when broker connection satus have changed
   * @param {string} instanceIndex index of an account instance connected
   * @param {boolean} connected is MetaTrader terminal is connected to broker
   * @return {Promise} promise which resolves when the asynchronous event is processed
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
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onAccountInformationUpdated(instanceIndex: string, accountInformation: MetatraderAccountInformation): Promise<any>;
  
  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
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
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionUpdated(instanceIndex: string, position: MetatraderPosition): Promise<any>;
  
  /**
   * Invoked when MetaTrader position is removed
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionRemoved(instanceIndex: string, positionId: string): Promise<any>;
  
  /**
   * Invoked when the pending orders are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex: string, orders: Array<MetatraderOrder>): Promise<any>;
  
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
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when a new MetaTrader history order is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrderAdded(instanceIndex: string, historyOrder: MetatraderOrder): Promise<any>;
  
  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrdersSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealAdded(instanceIndex: string, deal: MetatraderDeal): Promise<any>;
  
  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealsSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;
  
  /**
   * Invoked when a symbol specification was updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolSpecificationUpdated(instanceIndex: string, specification: MetatraderSymbolSpecification): Promise<any>;
  
  /**
   * Invoked when a symbol specification was removed
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} symbol removed symbol
   * @returns {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolSpecificationRemoved(instanceIndex: string, symbol: string): Promise<any>;
  
  /**
   * Invoked when a symbol specifications were updated
   * @param {string} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<string>} removedSymbols removed symbols
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolSpecificationsUpdated(instanceIndex: string, specifications: Array<MetatraderSymbolSpecification>, removedSymbols: Array<string>): Promise<any>;
  
  /**
   * Invoked when a symbol price was updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolPriceUpdated(instanceIndex: string, price: MetatraderSymbolPrice): Promise<any>;
  
  /**
   * Invoked when prices for several symbols were updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {number} equity account liquidation value
   * @param {number} margin margin used
   * @param {number} freeMargin free margin
   * @param {number} marginLevel margin level calculated as % of equity/margin
   * @param {number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSymbolPricesUpdated(instanceIndex: string, prices: Array<MetatraderSymbolPrice>, equity: number, margin: number, freeMargin: number, marginLevel: number,
    accountCurrencyExchangeRate: number): Promise<any>;
  
    /**
   * Invoked when symbol candles were updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderCandle>} candles updated MetaTrader symbol candles
   * @param {number} equity account liquidation value
   * @param {number} margin margin used
   * @param {number} freeMargin free margin
   * @param {number} marginLevel margin level calculated as % of equity/margin
   * @param {number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onCandlesUpdated(instanceIndex: string, candles: Array<MetatraderCandle>, equity: number, margin: number, freeMargin: number, marginLevel: number,
    accountCurrencyExchangeRate: number): Promise<any>;
  
  /**
   * Invoked when symbol ticks were updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderTick>} ticks updated MetaTrader symbol ticks
   * @param {number} equity account liquidation value
   * @param {number} margin margin used
   * @param {number} freeMargin free margin
   * @param {number} marginLevel margin level calculated as % of equity/margin
   * @param {number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onTicksUpdated(instanceIndex: string, ticks: Array<MetatraderTick>, equity: number, margin: number, freeMargin: number, marginLevel: number,
    accountCurrencyExchangeRate: number): Promise<any>;
  
  /**
   * Invoked when order books were updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {Array<MetatraderBook>} books updated MetaTrader order books
   * @param {number} equity account liquidation value
   * @param {number} margin margin used
   * @param {number} freeMargin free margin
   * @param {number} marginLevel margin level calculated as % of equity/margin
   * @param {number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onBooksUpdated(instanceIndex: string, books: Array<MetatraderBook>, equity: number, margin: number, freeMargin: number, marginLevel: number,
    accountCurrencyExchangeRate: number): Promise<any>;
  
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
   * Invoked when a stream for an instance index is closed
   * @param {string} instanceIndex index of an account instance connected
   */
  onStreamClosed(instanceIndex: string): Promise<any>;

  /**
   * Invoked when account region has been unsubscribed
   * @param {string} region account region unsubscribed
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onUnsubscribeRegion(region: string): Promise<any>;
}

/**
 * Server-side application health status
 */
export declare type HealthStatus = {

  /**
   * flag indicating that REST API is healthy
   */
  restApiHealthy?: boolean,

  /**
   * flag indicating that CopyFactory subscriber is healthy
   */
  copyFactorySubscriberHealthy?: boolean,

  /**
   * flag indicating that CopyFactory provider is healthy
   */
  copyFactoryProviderHealthy?: boolean
}