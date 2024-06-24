'use strict';

/**
 * Provides access to history database
 */
export default class HistoryDatabase {

  /**
   * Returns history database instance
   * @returns {HistoryDatabase} history database instance
   */
  static getInstance() {}

  /**
   * Loads history from database
   * @param {string} accountId account id
   * @param {string} application application name
   * @return {Promise<{deals: Array<MetatraderDeal>, historyOrders: Array<MetatraderOrder>}>} full account history
   */
  async loadHistory(accountId, application) {}

  /**
   * Removes history from database
   * @param {string} accountId account id
   * @param {string} application application name
   * @return {Promise} promise resolving when the history is removed
   */
  async clear(accountId, application) {}

  /**
   * Flushes the new history to db
   * @param {string} accountId account id
   * @param {string} application application name
   * @param {Array<MetatraderOrder>} newHistoryOrders history orders to save to db
   * @param {Array<MetatraderDeal>} newDeals deals to save to db
   * @return {Promise} promise resolving when the history is flushed
   */
  async flush(accountId, application, newHistoryOrders, newDeals) {}

}
