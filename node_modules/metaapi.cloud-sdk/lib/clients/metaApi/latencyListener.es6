'use strict';

/**
 * Receives notifications about server-side communication latencies
 */
export default class LatencyListener {

  /**
   * Object containing request latency information
   * @typedef {Object} ResponseTimestamps
   * @property {Date} clientProcessingStarted time when request processing have started on client side
   * @property {Date} serverProcessingStarted time when request processing have started on server side
   * @property {Date} serverProcessingFinished time when request processing have finished on server side
   * @property {Date} clientProcessingFinished time when request processing have finished on client side
   */

  /**
   * Invoked with latency information when application receives a response to RPC request
   * @param {string} accountId account id
   * @param {string} type request type
   * @param {ResponseTimestamps} timestamps request timestamps object containing latency information
   * @return {Promise} promise which resolves when latency information is processed
   */
  async onResponse(accountId, type, timestamps) {}

  /**
   * Timestamps object containing latency information about price streaming
   * @typedef {Object} SymbolPriceTimestamps
   * @property {Date} eventGenerated time the event was generated on exchange side
   * @property {Date} serverProcessingStarted time the event processing have started on server side
   * @property {Date} serverProcessingFinished time the event processing have finished on server side
   * @property {Date} clientProcessingFinished time the event processing have finished on client side
   */

  /**
   * Invoked with latency information when application receives symbol price update event
   * @param {string} accountId account id
   * @param {string} symbol price symbol
   * @param {SymbolPriceTimestamps} timestamps timestamps object containing latency information about price streaming
   * @return {Promise} promise which resolves when latency information is processed
   */
  async onSymbolPrice(accountId, symbol, timestamps) {}

  /**
   * Timestamps object containing latency information about update streaming
   * @typedef {Object} UpdateTimestamps
   * @property {Date} eventGenerated time the event was generated on exchange side
   * @property {Date} serverProcessingStarted time the event processing have started on server side
   * @property {Date} serverProcessingFinished time the event processing have finished on server side
   * @property {Date} clientProcessingFinished time the event processing have finished on client side
   */

  /**
   * Invoked with latency information when application receives update event
   * @param {string} accountId account id
   * @param {UpdateTimestamps} timestamps timestamps object containing latency information about update streaming
   * @return {Promise} promise which resolves when latency information is processed
   */
  async onUpdate(accountId, timestamps) {}

  /**
   * Timestamps object containing latency information about a trade
   * @typedef {Object} TradeTimestamps
   * @property {Date} clientProcessingStarted time when request processing have started on client side
   * @property {Date} serverProcessingStarted time the event processing have started on server side
   * @property {Date} serverProcessingFinished time the event processing have finished on server side
   * @property {Date} clientProcessingFinished time the event processing have finished on client side
   * @property {Date} tradeStarted time the trade execution was started on server side
   * @property {Date} tradeExecuted time the trade was executed on exchange side
   */

  /**
   * Invoked with latency information when application receives trade response
   * @param {string} accountId account id
   * @param {TradeTimestamps} timestamps timestamps object containing latency information about a trade
   * @return {Promise} promise which resolves when latency information is processed
   */
  async onTrade(accountId, timestamps) {}

}
