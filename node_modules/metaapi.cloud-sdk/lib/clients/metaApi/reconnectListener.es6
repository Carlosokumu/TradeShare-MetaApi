'use strict';

/**
 * Defines interface for a websocket reconnect listener class
 */
export default class ReconnectListener {

  /**
   * Invoked when connection to MetaTrader terminal re-established
   * @param {String} region reconnected region
   * @param {Number} instanceNumber reconnected instance number
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onReconnected(region, instanceNumber) {}
  
}
