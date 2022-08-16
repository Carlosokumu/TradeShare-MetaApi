'use strict';

import SynchronizationListener from '../clients/metaApi/synchronizationListener';
import moment from 'moment';
import Reservoir from './reservoir/reservoir';
import LoggerManager from '../logger';

/**
 * Tracks connection health status
 */
export default class ConnectionHealthMonitor extends SynchronizationListener {

  /**
   * Constructs the listener
   * @param {StreamingMetaApiConnection} connection MetaApi connection instance
   */
  constructor(connection) {
    super();
    this._connection = connection;
    const updateQuoteHealthStatusInterval = () => {
      this._updateQuoteHealthStatus();
      this._updateQuoteHealthStatusInterval = setTimeout(updateQuoteHealthStatusInterval.bind(this),
        this._getRandomTimeout());
    };
    this._updateQuoteHealthStatusInterval = setTimeout(updateQuoteHealthStatusInterval.bind(this),
      this._getRandomTimeout());
    const measureUptimeInterval = () => {
      this._measureUptime();
      this._measureUptimeInterval = setTimeout(measureUptimeInterval.bind(this),
        this._getRandomTimeout());
    };
    this._measureUptimeInterval = setTimeout(measureUptimeInterval.bind(this),
      this._getRandomTimeout());
    this._minQuoteInterval = 60000;
    this._serverHealthStatus = {};
    this._uptimeReservoirs = {
      '5m': new Reservoir(300, 5 * 60 * 1000),
      '1h': new Reservoir(600, 60 * 60 * 1000),
      '1d': new Reservoir(24 * 60, 24 * 60 * 60 * 1000),
      '1w': new Reservoir(24 * 7, 7 * 24 * 60 * 60 * 1000),
    };
    this._logger = LoggerManager.getLogger('ConnectionHealthMonitor');
  }

  /**
   * Stops health monitor
   */
  stop() {
    this._logger.debug(`${this._connection.account.id}: Stopping the monitor`);
    clearTimeout(this._updateQuoteHealthStatusInterval);
    clearTimeout(this._measureUptimeInterval);
  }

  /**
   * Invoked when a symbol price was updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   */
  onSymbolPriceUpdated(instanceIndex, price) {
    try {
      let brokerTimestamp = moment(price.brokerTime).toDate().getTime();
      this._priceUpdatedAt = new Date();
      this._offset = this._priceUpdatedAt.getTime() - brokerTimestamp;
    } catch (err) {
      // eslint-disable-next-line no-console
      this._logger.error(`${this._connection.account.id}: Failed to update quote ` + 
        'streaming health status on price update', err);
    }
  }

  /**
   * Invoked when a server-side application health status is received from MetaApi
   * @param {String} instanceIndex index of an account instance connected
   * @param {HealthStatus} status server-side application health status
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHealthStatus(instanceIndex, status) {
    this._serverHealthStatus['' + instanceIndex] = status;
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDisconnected(instanceIndex) {
    delete this._serverHealthStatus['' + instanceIndex];
  }

  /**
   * Returns server-side application health status
   * @return {HealthStatus} server-side application health status
   */
  get serverHealthStatus() {
    let result;
    for (let s of Object.values(this._serverHealthStatus)) {
      if (!result) {
        result = s;
      } else {
        for (let field of Object.keys(s)) {
          result[field] = result[field] || s[field];
        }
      }
    }
    return result || {};
  }

  /**
   * Connection health status
   * @typedef {Object} ConnectionHealthStatus
   * @property {Boolean} connected flag indicating successful connection to API server
   * @property {Boolean} connectedToBroker flag indicating successful connection to broker
   * @property {Boolean} quoteStreamingHealthy flag indicating that quotes are being streamed successfully from the
   * broker
   * @property {Boolean} synchronized flag indicating a successful synchronization
   * @property {Boolean} healthy flag indicating overall connection health status
   * @property {String} message health status message
   */

  /**
   * Returns health status
   * @returns {ConnectionHealthStatus} connection health status
   */
  // eslint-disable-next-line complexity
  get healthStatus() {
    let status = {
      connected: this._connection.terminalState.connected,
      connectedToBroker: this._connection.terminalState.connectedToBroker,
      quoteStreamingHealthy: this._quotesHealthy,
      synchronized: this._connection.synchronized
    };
    status.healthy = status.connected && status.connectedToBroker && status.quoteStreamingHealthy &&
      status.synchronized;
    let message;
    if (status.healthy) {
      message = 'Connection to broker is stable. No health issues detected.';
    } else {
      message = 'Connection is not healthy because ';
      let reasons = [];
      if (!status.connected) {
        reasons.push('connection to API server is not established or lost');
      }
      if (!status.connectedToBroker) {
        reasons.push('connection to broker is not established or lost');
      }
      if (!status.synchronized) {
        reasons.push('local terminal state is not synchronized to broker');
      }
      if (!status.quoteStreamingHealthy) {
        reasons.push('quotes are not streamed from the broker properly');
      }
      message = message + reasons.join(' and ') + '.';
    }
    status.message = message;
    return status;
  }

  /**
   * Returns uptime in percents measured over specific periods of time
   * @returns {Object} uptime in percents measured over specific periods of time
   */
  get uptime() {
    let uptime = {};
    for (let e of Object.entries(this._uptimeReservoirs)) {
      uptime[e[0]] = e[1].getStatistics().average;
    }
    return uptime;
  }

  _measureUptime() {
    try {
      Object.values(this._uptimeReservoirs).forEach(r => r.pushMeasurement(this._connection.terminalState.connected &&
        this._connection.terminalState.connectedToBroker && this._connection.synchronized &&
        this._quotesHealthy ? 100 : 0));
    } catch (err) {
      // eslint-disable-next-line no-console
      this._logger.error('failed to measure uptime for account ' +
        this._connection.account.id, err);
    }
  }

  // eslint-disable-next-line complexity
  _updateQuoteHealthStatus() {
    try {
      let serverDateTime = moment(new Date(Date.now() - this._offset));
      let serverTime = serverDateTime.format('HH:mm:ss.SSS');
      let dayOfWeek = serverDateTime.day();
      let daysOfWeek = {
        0: 'SUNDAY',
        1: 'MONDAY',
        2: 'TUESDAY',
        3: 'WEDNESDAY',
        4: 'THURSDAY',
        5: 'FRIDAY',
        6: 'SATURDAY'
      };
      let inQuoteSession = false;
      if (!this._priceUpdatedAt) {
        this._priceUpdatedAt = new Date();
      }
      if (!(this._connection.subscribedSymbols || []).length) {
        this._priceUpdatedAt = new Date();
      }
      for (let symbol of this._connection.subscribedSymbols || []) {
        let specification = this._connection.terminalState.specification(symbol) || {};
        let quoteSessions = (specification.quoteSessions || [])[daysOfWeek[dayOfWeek]] || [];
        for (let session of quoteSessions) {
          if (session.from <= serverTime && session.to >= serverTime) {
            inQuoteSession = true;
          }
        }
      }
      this._quotesHealthy = !this._connection.subscribedSymbols.length || !inQuoteSession ||
        (Date.now() - this._priceUpdatedAt.getTime() < this._minQuoteInterval);
    } catch (err) {
      // eslint-disable-next-line no-console
      this._logger.error('failed to update quote streaming health status for account ' +
        this._connection.account.id, err);
    }
  }

  _getRandomTimeout() {
    return (Math.random() * 59  + 1) * 1000;
  }

}
