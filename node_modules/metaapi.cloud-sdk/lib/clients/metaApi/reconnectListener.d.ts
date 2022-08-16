/**
 * Defines interface for a websocket reconnect listener class
 */
export default class ReconnectListener {
  
  /**
   * Invoked when connection to MetaTrader terminal re-established
   * @param {string} region reconnected region
   * @param {number} instanceNumber reconnected instance number
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onReconnected(region: string, instanceNumber: number): Promise<any>;
}