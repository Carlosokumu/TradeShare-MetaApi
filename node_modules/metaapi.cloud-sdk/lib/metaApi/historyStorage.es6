'use strict';

import SynchronizationListener from '../clients/metaApi/synchronizationListener';

/**
 * Abstract class which defines MetaTrader history storage interface.
 */
export default class HistoryStorage extends SynchronizationListener {

  /**
   * Constructs the history storage
   */
  constructor() {
    super();
    this._orderSynchronizationFinished = {};
    this._dealSynchronizationFinished = {};
  }

  /**
   * Initializes the storage and loads required data from a persistent storage
   * @param {string} accountId account id
   * @param {string} application application
   * @returns {Promise} promise resolving when history storage is initialized
   */
  async initialize(accountId, application) {
    this._accountId = accountId;
    this._application = application;
  }

  /**
   * Returns flag indicating whether order history synchronization have finished
   * @return {Boolean} flag indicating whether order history synchronization have finished
   */
  get orderSynchronizationFinished() {
    return Object.values(this._orderSynchronizationFinished).reduce((acc, r) => acc || r, false);
  }

  /**
   * Returns flag indicating whether deal history synchronization have finished
   * @return {Boolean} flag indicating whether deal history synchronization have finished
   */
  get dealSynchronizationFinished() {
    return Object.values(this._dealSynchronizationFinished).reduce((acc, r) => acc || r, false);
  }

  /**
   * Clears the storage and deletes persistent data
   * @returns {Promise} promise resolving when history storage is cleared
   */
  async clear() {
    throw Error('Abstract method clear has no implementation');
  }

  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {String} [instanceIndex] index of an account instance connected
   * @returns {Promise<Date>} the time of the last history order record stored in the history storage
   */
  async lastHistoryOrderTime(instanceIndex) {
    throw Error('Abstract method lastHistoryOrderTime has no implementation');
  }

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {String} [instanceIndex] index of an account instance connected
   * @returns {Promise<Date>} the time of the last history deal record stored in the history storage
   */
  async lastDealTime(instanceIndex) {
    throw Error('Abstract method lastDealTime has no implementation');
  }

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrderAdded(instanceIndex, historyOrder) {
    throw Error('Abstract method onHistoryOrderAdded has no implementation');
  }

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealAdded(instanceIndex, deal) {
    throw Error('Abstract method onDealAdded has no implementation');
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealsSynchronized(instanceIndex, synchronizationId) {
    const instance = this.getInstanceNumber(instanceIndex);
    this._dealSynchronizationFinished['' + instance] = true;
  }

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrdersSynchronized(instanceIndex, synchronizationId) {
    const instance = this.getInstanceNumber(instanceIndex);
    this._orderSynchronizationFinished['' + instance] = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex) {
    const instance = this.getInstanceNumber(instanceIndex);
    this._orderSynchronizationFinished['' + instance] = false;
    this._dealSynchronizationFinished['' + instance] = false;
  }

  /**
   * Returns all deals
   * @returns {Array<MetatraderDeal>} all deals
   */
  get deals() {
    throw Error('Abstract property deals has no implementation');
  }

  /**
   * Returns deals by ticket id
   * @param {string} id ticket id
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByTicket(id) {
    throw Error('Abstract method getDealsByTicket has no implementation');
  }

  /**
   * Returns deals by position id
   * @param {string} positionId position id
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByPosition(positionId) {
    throw Error('Abstract method getDealsByPosition has no implementation');
  }

  /**
   * Returns deals by time range
   * @param startTime start time, inclusive
   * @param endTime end time, inclusive
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByTimeRange(startTime, endTime) {
    throw Error('Abstract method getDealsByTimeRange has no implementation');
  }

  /**
   * Returns all history orders
   * @returns {Array<MetatraderOrder>} all history orders
   */
  get historyOrders() {
    throw Error('Abstract property historyOrders has no implementation');
  }

  /**
   * Returns history orders by ticket id
   * @param {string} id ticket id
   * @returns {Array<MetatraderOrder>} history orders found
   */
  getHistoryOrdersByTicket(id) {
    throw Error('Abstract method getHistoryOrdersByTicket has no implementation');
  }

  /**
   * Returns history orders by position id
   * @param {string} positionId position id
   * @returns {Array<MetatraderOrder>} history orders found
   */
  getHistoryOrdersByPosition(positionId) {
    throw Error('Abstract method getHistoryOrdersByPosition has no implementation');
  }

  /**
   * Returns history orders by time range
   * @param startTime start time, inclusive
   * @param endTime end time, inclusive
   * @returns {Array<MetatraderOrder>} hisotry orders found
   */
  getHistoryOrdersByTimeRange(startTime, endTime) {
    throw Error('Abstract method getHistoryOrdersByTimeRange has no implementation');
  }

}
