'use strict';

import HistoryDatabase from './historyDatabase';
import Logger from '../../logger';
import {openDB} from 'idb';

/**
 * Provides access to history database stored in a browser IndexedDB
 */
export default class BrowserHistoryDatabase extends HistoryDatabase {

  /**
   * Constructs the class instance
   */
  constructor() {
    super();
    this._logger = Logger.getLogger('BrowserHistoryDatabase');
  }

  /**
   * Returns history database instance
   * @returns {HistoryDatabase} history database instance
   */
  static getInstance() {
    if (!BrowserHistoryDatabase.instance) {
      BrowserHistoryDatabase.instance = new BrowserHistoryDatabase();
    }
    return BrowserHistoryDatabase.instance;
  }

  /**
   * Loads history from database
   * @param {string} accountId account id
   * @param {string} application application name
   * @return {Promise<{deals: Array<MetatraderDeal>, historyOrders: Array<MetatraderOrder>}>} full account history
   */
  async loadHistory(accountId, application) {
    let db;
    try {
      db = await this._getDatabase();
      let deals = await this._readDb(db, 'deals', accountId + '-' + application);
      deals.forEach(deal => deal.time = new Date(deal.time));
      let historyOrders = await this._readDb(db, 'historyOrders', accountId + '-' + application);
      historyOrders.forEach(historyOrder => {
        historyOrder.time = new Date(historyOrder.time);
        historyOrder.doneTime = new Date(historyOrder.doneTime);
      });
      return {deals, historyOrders};
    } catch (err) {
      this._logger.warn(`${accountId}: failed to read history database, will reinitialize it now`, err);
      await this.clear(accountId, application);
      return {deals: [], historyOrders: []};
    } finally {
      try {
        await db.close();
      } catch (err) {
        this._logger.error(`${accountId}: error closing db`, err);
      }
    }
  }

  /**
   * Removes history from database
   * @param {string} accountId account id
   * @param {string} application application name
   * @return {Promise} promise resolving when the history is removed
   */
  async clear(accountId, application) {
    const prefix = accountId + '-' + application;
    const range = IDBKeyRange.bound(prefix, prefix + ':');
    let db;
    try {
      db = await this._getDatabase();
      await db.delete('deals', range);
      await db.delete('dealsIndex', range);
      await db.delete('historyOrders', range);
      await db.delete('historyOrdersIndex', range);
    } catch (e) {
      this._logger.warn(`${accountId}: failed to clear history storage`, e);
    } finally {
      try {
        await db.close();
      } catch (err) {
        this._logger.error(`${accountId}: error closing db`, err);
      }
    }
  }

  /**
   * Flushes the new history to db
   * @param {string} accountId account id
   * @param {string} application application name
   * @param {Array<MetatraderOrder>} newHistoryOrders history orders to save to db
   * @param {Array<MetatraderDeal>} newDeals deals to save to db
   * @return {Promise} promise resolving when the history is flushed
   */
  async flush(accountId, application, newHistoryOrders, newDeals) {
    let db;
    try {
      db = await this._getDatabase();
      await this._appendDb(db, 'deals', accountId + '-' + application, newDeals);
      await this._appendDb(db, 'historyOrders', accountId + '-' + application, newHistoryOrders);
    } catch (e) {
      this._logger.warn(`${accountId}: failed to flush history storage`, e);
    } finally {
      try {
        await db.close();
      } catch (err) {
        this._logger.error(`${accountId}: error closing db`, err);
      }
    }
  }

  async _getDatabase() {
    const keyPath = 'id';
    const db = await openDB('metaapi', 2, {
      upgrade(database, oldVersion, newVersion, transaction) {
        if (oldVersion !== 2) {
          if (database.objectStoreNames.contains('deals')) {
            database.deleteObjectStore('deals');
          }
          if (database.objectStoreNames.contains('historyOrders')) {
            database.deleteObjectStore('historyOrders');
          }
        }
        if (!database.objectStoreNames.contains('dealsIndex')) {
          database.createObjectStore('dealsIndex', {keyPath});
        }
        if (!database.objectStoreNames.contains('deals')) {
          database.createObjectStore('deals', {keyPath});
        }
        if (!database.objectStoreNames.contains('historyOrdersIndex')) {
          database.createObjectStore('historyOrdersIndex', {keyPath});
        }
        if (!database.objectStoreNames.contains('historyOrders')) {
          database.createObjectStore('historyOrders', {keyPath});
        }
      },
    });
    return db;
  }

  async _readDb(db, store, prefix) {
    const keys = await db.getAllKeys(store, IDBKeyRange.bound(prefix, prefix + '-' + ':'));
    let result = [];
    for (let key of keys) {
      let value = await db.get(store, key);
      if (value) {
        for (let line of value.data.split('\n')) {
          if (line.length) {
            let record = JSON.parse(line);
            result.push(record);
          }
        }
      }
    }
    return result;
  }

  async _appendDb(db, store, prefix, records) {
    if (records && records.length) {
      let lastKey = await db.get(store + 'Index', prefix + '-' + 'sn');
      let index = (lastKey || {index: 0}).index + 1;
      let data = records.map(r => JSON.stringify(r) + '\n').join('');
      await db.put(store, {data, id: prefix + '-' + index});
      await db.put(store + 'Index', {id: prefix + '-' + 'sn', index});
    }
  }

}
