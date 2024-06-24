'use strict';

/**
 * Defines interface for a synchronization listener class
 */
export default class SynchronizationListener {

  /**
   * Returns region of instance index
   * @param {String} instanceIndex instance index
   */
  getRegion(instanceIndex) {
    return typeof instanceIndex === 'string' ? instanceIndex.split(':')[0] : undefined;
  }

  /**
   * Returns instance number of instance index
   * @param {String} instanceIndex instance index
   */
  getInstanceNumber(instanceIndex) {
    return typeof instanceIndex === 'string' ? Number(instanceIndex.split(':')[1]) : undefined;
  }

  /**
   * Returns host name of instance index
   * @param {String} instanceIndex instance index
   */
  getHostName(instanceIndex) {
    return typeof instanceIndex === 'string' ? instanceIndex.split(':')[2] : undefined;
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected(instanceIndex, replicas) {}

  /**
   * Server-side application health status
   * @typedef {Object} healthStatus
   * @property {boolean} [restApiHealthy] flag indicating that REST API is healthy
   * @property {boolean} [copyFactorySubscriberHealthy] flag indicating that CopyFactory subscriber is healthy
   * @property {boolean} [copyFactoryProviderHealthy] flag indicating that CopyFactory provider is healthy
   */

  /**
   * Invoked when a server-side application health status is received from MetaApi
   * @param {String} instanceIndex index of an account instance connected
   * @param {HealthStatus} status server-side application health status
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHealthStatus(instanceIndex, status) {}

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDisconnected(instanceIndex) {}

  /**
   * Invoked when broker connection satus have changed
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBrokerConnectionStatusChanged(instanceIndex, connected) {}

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSynchronizationStarted(instanceIndex, specificationsUpdated, positionsUpdated, ordersUpdated) {}

  /**
   * Invoked when MetaTrader account information is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onAccountInformationUpdated(instanceIndex, accountInformation) {}

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsReplaced(instanceIndex, positions) {}

  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionsSynchronized(instanceIndex, synchronizationId) {}

  /**
   * Invoked when MetaTrader position is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionUpdated(instanceIndex, position) {}

  /**
   * Invoked when MetaTrader position is removed
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPositionRemoved(instanceIndex, positionId) {}

  /**
   * Invoked when the pending orders are replaced as a result of initial terminal state synchronization. This method
   * will be invoked only if server thinks the data was updated, otherwise invocation can be skipped
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersReplaced(instanceIndex, orders) {}

  /**
   * Invoked when MetaTrader pending order is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader pending order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrderUpdated(instanceIndex, order) {}

  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} orderId completed MetaTrader pending order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrderCompleted(instanceIndex, orderId) {}

  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersSynchronized(instanceIndex, synchronizationId) {}

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrderAdded(instanceIndex, historyOrder) {}

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrdersSynchronized(instanceIndex, synchronizationId) {}

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealAdded(instanceIndex, deal) {}

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealsSynchronized(instanceIndex, synchronizationId) {}

  /**
   * Invoked when a symbol specification was updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolSpecification} specification updated MetaTrader symbol specification
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationUpdated(instanceIndex, specification) {}

  /**
   * Invoked when a symbol specification was removed
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} symbol removed symbol
   * @returns {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationRemoved(instanceIndex, symbol) {}

  /**
   * Invoked when a symbol specifications were updated
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolSpecificationsUpdated(instanceIndex, specifications, removedSymbols) {}

  /**
   * Invoked when a symbol price was updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPriceUpdated(instanceIndex, price) {}

  /**
   * Invoked when prices for several symbols were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSymbolPricesUpdated(instanceIndex, prices, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when symbol candles were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderCandle>} candles updated MetaTrader symbol candles
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onCandlesUpdated(instanceIndex, candles, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when symbol ticks were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderTick>} ticks updated MetaTrader symbol ticks
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onTicksUpdated(instanceIndex, ticks, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when order books were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderBook>} books updated MetaTrader order books
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   * @param {Number} accountCurrencyExchangeRate current exchange rate of account currency into USD
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onBooksUpdated(instanceIndex, books, equity, margin, freeMargin, marginLevel,
    accountCurrencyExchangeRate) {}

  /**
   * Invoked when subscription downgrade has occurred
   * @param {String} instanceIndex index of an account instance connected
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSubscriptionDowngraded(instanceIndex, symbol, updates, unsubscriptions) {}

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   */
  async onStreamClosed(instanceIndex) {}

  /**
   * Invoked when account region has been unsubscribed
   * @param {String} region account region unsubscribed
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onUnsubscribeRegion(region) {}

}
