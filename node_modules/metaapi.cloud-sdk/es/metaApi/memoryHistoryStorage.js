'use strict';

import HistoryStorage from './historyStorage';
import HistoryDatabase from './historyDatabase/index';
import {AVLTree} from 'binary-search-tree';
import LoggerManager from '../logger';

/**
 * History storage which stores MetaTrader history in RAM
 */
export default class MemoryHistoryStorage extends HistoryStorage {

  /**
   * Constructs the in-memory history store instance
   */
  constructor() {
    super();
    this._historyDatabase = HistoryDatabase.getInstance();
    this._reset();
    this._logger = LoggerManager.getLogger('MemoryHistoryStorage');
  }

  /**
   * Initializes the storage and loads required data from a persistent storage
   * @param {string} accountId account id
   * @param {string} [application] application. Default is MetaApi
   */
  async initialize(accountId, application = 'MetaApi') {
    await super.initialize(accountId, application);
    let {deals, historyOrders} = await this._historyDatabase.loadHistory(accountId, application);
    for (let deal of deals) {
      await this._addDeal(deal, true);
    }
    for (let historyOrder of historyOrders) {
      await this._addHistoryOrder(historyOrder, true);
    }
  }

  /**
   * Resets the storage. Intended for use in tests
   * @returns {Promise} promise when the history is removed
   */
  async clear() {
    this._reset();
    await this._historyDatabase.clear(this._accountId, this._application);
  }

  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {Number} [instanceNumber] index of an account instance connected
   * @returns {Date} the time of the last history order record stored in the history storage
   */
  lastHistoryOrderTime(instanceNumber) {
    return this._maxHistoryOrderTime;
  }

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {Number} [instanceNumber] index of an account instance connected
   * @returns {Date} the time of the last history deal record stored in the history storage
   */
  lastDealTime(instanceNumber) {
    return this._maxDealTime;
  }

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   */
  async onHistoryOrderAdded(instanceIndex, historyOrder) {
    await this._addHistoryOrder(historyOrder);
  }

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   */
  async onDealAdded(instanceIndex, deal) {
    await this._addDeal(deal);
  }

  /**
   * Returns all deals
   * @returns {Array<MetatraderDeal>} all deals
   */
  get deals() {
    return this.getDealsByTimeRange(new Date(0), new Date(8640000000000000));
  }

  /**
   * Returns deals by ticket id
   * @param {string} id ticket id
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByTicket(id) {
    let deals = Object.values(this._dealsByTicket[id] || {});
    deals.sort(this._dealsComparator);
    return deals;
  }

  /**
   * Returns deals by position id
   * @param {string} positionId position id
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByPosition(positionId) {
    let deals = Object.values(this._dealsByPosition[positionId] || {});
    deals.sort(this._dealsComparator);
    return deals;
  }

  /**
   * Returns deals by time range
   * @param startTime start time, inclusive
   * @param endTime end time, inclusive
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByTimeRange(startTime, endTime) {
    let deals = this._dealsByTime.betweenBounds({
      $gte: {time: startTime, id: 0, entryType: ''},
      $lte: {time: endTime, id: Number.MAX_VALUE, entryType: ''}
    });
    return deals;
  }

  /**
   * Returns all history orders
   * @returns {Array<MetatraderOrder>} all history orders
   */
  get historyOrders() {
    return this.getHistoryOrdersByTimeRange(new Date(0), new Date(8640000000000000));
  }

  /**
   * Returns history orders by ticket id
   * @param {string} id ticket id
   * @returns {Array<MetatraderOrder>} history orders found
   */
  getHistoryOrdersByTicket(id) {
    let historyOrders = Object.values(this._historyOrdersByTicket[id] || {});
    historyOrders.sort(this._historyOrdersComparator);
    return historyOrders;
  }

  /**
   * Returns history orders by position id
   * @param {string} positionId position id
   * @returns {Array<MetatraderOrder>} history orders found
   */
  getHistoryOrdersByPosition(positionId) {
    let historyOrders = Object.values(this._historyOrdersByPosition[positionId] || {});
    historyOrders.sort(this._historyOrdersComparator);
    return historyOrders;
  }

  /**
   * Returns history orders by time range
   * @param startTime start time, inclusive
   * @param endTime end time, inclusive
   * @returns {Array<MetatraderOrder>} hisotry orders found
   */
  getHistoryOrdersByTimeRange(startTime, endTime) {
    let historyOrders = this._historyOrdersByTime.betweenBounds({
      $gte: {doneTime: startTime, id: 0, type: '', state: ''},
      $lte: {doneTime: endTime, id: Number.MAX_VALUE, type: '', state: ''}
    });
    return historyOrders;
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealsSynchronized(instanceIndex, synchronizationId) {
    await this._flushDatabase();
    await super.onDealsSynchronized(instanceIndex, synchronizationId);
  }

  _reset() {
    this._orderSynchronizationFinished = {};
    this._dealSynchronizationFinished = {};
    this._dealsByTicket = {};
    this._dealsByPosition = {};
    this._historyOrdersByTicket = {};
    this._historyOrdersByPosition = {};
    // eslint-disable-next-line complexity
    this._historyOrdersComparator = (o1, o2) => {
      let timeDiff = (o1.doneTime || new Date(0)).getTime() - (o2.doneTime || new Date(0)).getTime();
      if (timeDiff === 0) {
        let idDiff = o1.id - o2.id;
        if (idDiff === 0) {
          if (o1.type > o2.type) {
            return 1;
          } else if (o1.type < o2.type) {
            return -1;
          } else {
            if (o1.state > o2.state) {
              return 1;
            } else if (o1.state < o2.state) {
              return -1;
            } else {
              return 0;
            }
          }
        } else {
          return idDiff;
        }
      } else {
        return timeDiff;
      }
    };
    this._historyOrdersByTime = new AVLTree({compareKeys: this._historyOrdersComparator});
    this._dealsComparator = (d1, d2) => {
      let timeDiff = (d1.time || new Date(0)).getTime() - (d2.time || new Date(0)).getTime();
      if (timeDiff === 0) {
        let idDiff = d1.id - d2.id;
        if (idDiff === 0) {
          if (d1.entryType > d2.entryType) {
            return 1;
          } else if (d1.entryType < d2.entryType) {
            return -1;
          } else {
            return 0;
          }
        } else {
          return idDiff;
        }
      } else {
        return timeDiff;
      }
    };
    this._dealsByTime = new AVLTree({compareKeys: this._dealsComparator});
    this._maxHistoryOrderTime = new Date(0);
    this._maxDealTime = new Date(0);
    this._newHistoryOrders = [];
    this._newDeals = [];
    clearTimeout(this._flushTimeout);
    delete this._flushTimeout;
  }

  // eslint-disable-next-line complexity
  async _addDeal(deal, existing) {
    let key = this._getDealKey(deal);
    this._dealsByTicket[deal.id] = this._dealsByTicket[deal.id] || {};
    let newDeal = !existing && !this._dealsByTicket[deal.id][key];
    this._dealsByTicket[deal.id][key] = deal;
    if (deal.positionId) {
      this._dealsByPosition[deal.positionId] = this._dealsByPosition[deal.positionId] || {};
      this._dealsByPosition[deal.positionId][key] = deal;
    }
    this._dealsByTime.delete(deal);
    this._dealsByTime.insert(deal, deal);
    if (deal.time && (!this._maxDealTime || this._maxDealTime.getTime() < deal.time.getTime())) {
      this._maxDealTime = deal.time;
    }
    if (newDeal) {
      this._newDeals.push(deal);
      clearTimeout(this._flushTimeout);
      this._flushTimeout = setTimeout(this._flushDatabase.bind(this), 5000);
    }
  }

  _getDealKey(deal) {
    return (deal.time || new Date(0)).toISOString() + ':' + deal.id + ':' + deal.entryType;
  }

  // eslint-disable-next-line complexity
  async _addHistoryOrder(historyOrder, existing) {
    let key = this._getHistoryOrderKey(historyOrder);
    this._historyOrdersByTicket[historyOrder.id] = this._historyOrdersByTicket[historyOrder.id] || {};
    let newHistoryOrder = !existing && !this._historyOrdersByTicket[historyOrder.id][key];
    this._historyOrdersByTicket[historyOrder.id][key] = historyOrder;
    if (historyOrder.positionId) {
      this._historyOrdersByPosition[historyOrder.positionId] = this._historyOrdersByPosition[historyOrder.positionId] ||
        {};
      this._historyOrdersByPosition[historyOrder.positionId][key] = historyOrder;
    }
    this._historyOrdersByTime.delete(historyOrder);
    this._historyOrdersByTime.insert(historyOrder, historyOrder);
    if (historyOrder.doneTime && (!this._maxHistoryOrderTime ||
        this._maxHistoryOrderTime.getTime() < historyOrder.doneTime.getTime())) {
      this._maxHistoryOrderTime = historyOrder.doneTime;
    }
    if (newHistoryOrder) {
      this._newHistoryOrders.push(historyOrder);
      clearTimeout(this._flushTimeout);
      this._flushTimeout = setTimeout(this._flushDatabase.bind(this), 5000);
    }
  }

  _getHistoryOrderKey(historyOrder) {
    return (historyOrder.doneTime || new Date(0)).toISOString() + ':' + historyOrder.id + ':' +
      historyOrder.type + ':' + historyOrder.status;
  }

  async _flushDatabase() {
    if (this._flushPromise) {
      await this._flushPromise;
    }
    if (this._flushRunning) {
      return;
    }
    this._flushRunning = true;
    let resolve;
    this._flushPromise = new Promise(res => resolve = res);
    try {
      await this._historyDatabase.flush(this._accountId, this._application, this._newHistoryOrders, this._newDeals);
      this._newHistoryOrders = [];
      this._newDeals = [];
      this._logger.debug(`${this._accountId}: flushed history db`);
    } catch (err) {
      this._logger.warn(`${this._accountId}: error flushing history db`, err);
      this._flushTimeout = setTimeout(this._flushDatabase.bind(this), 15000);
    } finally {
      resolve();
      this._flushRunning = false;
    }
  }

}
