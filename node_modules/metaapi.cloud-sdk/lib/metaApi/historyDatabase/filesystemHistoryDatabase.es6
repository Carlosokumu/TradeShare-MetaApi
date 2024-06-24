'use strict';

import HistoryDatabase from './historyDatabase';
import {getLogger} from '../../logger';
import fs from 'fs';
import path from 'path';

/**
 * Provides access to history database stored on filesystem
 */
export default class FilesystemHistoryDatabase extends HistoryDatabase {

  /**
   * Constructs the class instance
   */
  constructor() {
    super();
    this._logger = getLogger('FilesystemHistoryDatabase');
  }

  /**
   * Returns history database instance
   * @returns {HistoryDatabase} history database instance
   */
  static getInstance() {
    if (!FilesystemHistoryDatabase.instance) {
      FilesystemHistoryDatabase.instance = new FilesystemHistoryDatabase();
    }
    return FilesystemHistoryDatabase.instance;
  }

  /**
   * Loads history from database
   * @param {string} accountId account id
   * @param {string} application application name
   * @return {Promise<{deals: Array<MetatraderDeal>, historyOrders: Array<MetatraderOrder>}>} full account history
   */
  async loadHistory(accountId, application) {
    let {dealsFile, historyOrdersFile} = await this._getDbLocation(accountId, application);
    let deals = await this._readDb(accountId, dealsFile);
    if(deals.length && Array.isArray(deals[0])) {
      this.clear(accountId, application);
      deals = [];
    }
    deals.forEach(deal => deal.time = new Date(deal.time));
    let historyOrders = await this._readDb(accountId, historyOrdersFile);
    if(historyOrders.length && Array.isArray(historyOrders[0])) {
      this.clear(accountId, application);
      historyOrders = [];
    }
    historyOrders.forEach(historyOrder => {
      historyOrder.time = new Date(historyOrder.time);
      historyOrder.doneTime = new Date(historyOrder.doneTime);
    });
    return {deals, historyOrders};
  }

  /**
   * Removes history from database
   * @param {string} accountId account id
   * @param {string} application application name
   * @return {Promise} promise resolving when the history is removed
   */
  async clear(accountId, application) {
    let {dealsFile, historyOrdersFile} = await this._getDbLocation(accountId, application);
    if(fs.existsSync(dealsFile)) {
      await fs.promises.unlink(dealsFile);
    }
    if(fs.existsSync(historyOrdersFile)) {
      await fs.promises.unlink(historyOrdersFile);
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
    let {dealsFile, historyOrdersFile} = await this._getDbLocation(accountId, application);
    await this._appendDb(historyOrdersFile, newHistoryOrders);
    await this._appendDb(dealsFile, newDeals);
  }

  async _getDbLocation(accountId, application) {
    let dir = path.join(process.cwd(), '.metaapi');
    await fs.promises.mkdir(dir, {recursive: true});
    return {
      dealsFile: path.join(dir, `${accountId}-${application}-deals.bin`),
      historyOrdersFile: path.join(dir, `${accountId}-${application}-historyOrders.bin`)
    };
  }

  async _readDb(accountId, file) {
    if (!fs.existsSync(file)) {
      return [];
    }
    try {
      let data = await fs.promises.readFile(file, 'utf-8');
      let lines = data.split('\n');
      let result = [];
      for (let line of lines) {
        if (line.length) {
          result.push(JSON.parse(line));
        }
      }
      return result;
    } catch (err) {
      this._logger.warn(`${accountId}: failed to read history db, will remove ${file} now`, err);
      await fs.promises.unlink(file);
      return [];
    }
  }

  async _appendDb(file, records) {
    if (records && records.length) {
      await fs.promises.appendFile(file, records.map(r => JSON.stringify(r) + '\n').join(''), 'utf-8');
    }
  }

}
