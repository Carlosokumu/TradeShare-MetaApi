'use strict';

import LatencyListener from '../clients/metaApi/latencyListener';
import StatisticalReservoir from './reservoir/statisticalReservoir';
import Reservoir from './reservoir/reservoir';

/**
 * Responsible for monitoring MetaApi application latencies
 */
export default class LatencyMonitor extends LatencyListener {

  /**
   * Constructs latency monitor instance
   */
  constructor() {
    super();
    this._tradeReservoirs = {
      clientLatency: this._initializeReservoirs(),
      serverLatency: this._initializeReservoirs(),
      brokerLatency: this._initializeReservoirs()
    };
    this._updateReservoirs = {
      clientLatency: this._initializeReservoirs(),
      serverLatency: this._initializeReservoirs(),
      brokerLatency: this._initializeReservoirs()
    };
    this._priceReservoirs = {
      clientLatency: this._initializeReservoirs(),
      serverLatency: this._initializeReservoirs(),
      brokerLatency: this._initializeReservoirs()
    };
    this._requestReservoirs = {
      branch: true
    };
  }

  /**
   * Invoked with latency information when application receives a response to RPC request
   * @param {string} accountId account id
   * @param {string} type request type
   * @param {ResponseTimestamps} timestamps request timestamps object containing latency information
   */
  onResponse(accountId, type, timestamps) {
    if (!this._requestReservoirs[type]) {
      this._requestReservoirs[type] = {
        branch: true,
        clientLatency: this._initializeReservoirs(),
        serverLatency: this._initializeReservoirs()
      };
    }
    if (timestamps.serverProcessingStarted && timestamps.serverProcessingFinished) {
      let serverLatency = timestamps.serverProcessingFinished.getTime() - timestamps.serverProcessingStarted.getTime();
      this._saveMeasurement(this._requestReservoirs[type].serverLatency, serverLatency);
    }
    if (timestamps.clientProcessingStarted && timestamps.clientProcessingFinished &&
      timestamps.serverProcessingStarted && timestamps.serverProcessingFinished) {
      let serverLatency = timestamps.serverProcessingFinished.getTime() - timestamps.serverProcessingStarted.getTime();
      let clientLatency = timestamps.clientProcessingFinished.getTime() - timestamps.clientProcessingStarted.getTime() -
        serverLatency;
      this._saveMeasurement(this._requestReservoirs[type].clientLatency, clientLatency);
    }
  }

  /**
   * Returns request processing latencies
   * @returns {Object} request processing latencies
   */
  get requestLatencies() {
    return this._constructLatenciesRecursively(this._requestReservoirs);
  }

  /**
   * Invoked with latency information when application receives symbol price update event
   * @param {string} accountId account id
   * @param {string} symbol price symbol
   * @param {SymbolPriceTimestamps} timestamps timestamps object containing latency information about price streaming
   */
  onSymbolPrice(accountId, symbol, timestamps) {
    if (timestamps.eventGenerated && timestamps.serverProcessingStarted) {
      let brokerLatency = timestamps.serverProcessingStarted.getTime() - timestamps.eventGenerated.getTime();
      this._saveMeasurement(this._priceReservoirs.brokerLatency, brokerLatency);
    }
    if (timestamps.serverProcessingStarted && timestamps.serverProcessingFinished) {
      let serverLatency = timestamps.serverProcessingFinished.getTime() - timestamps.serverProcessingStarted.getTime();
      this._saveMeasurement(this._priceReservoirs.serverLatency, serverLatency);
    }
    if (timestamps.serverProcessingFinished && timestamps.clientProcessingFinished) {
      let clientLatency = timestamps.clientProcessingFinished.getTime() - timestamps.serverProcessingFinished.getTime();
      this._saveMeasurement(this._priceReservoirs.clientLatency, clientLatency);
    }
  }

  /**
   * Returns price streaming latencies
   * @returns {Object} price streaming latencies
   */
  get priceLatencies() {
    return this._constructLatenciesRecursively(this._priceReservoirs);
  }

  /**
   * Invoked with latency information when application receives update event
   * @param {string} accountId account id
   * @param {UpdateTimestamps} timestamps timestamps object containing latency information about update streaming
   */
  onUpdate(accountId, timestamps) {
    if (timestamps.eventGenerated && timestamps.serverProcessingStarted) {
      let brokerLatency = timestamps.serverProcessingStarted.getTime() - timestamps.eventGenerated.getTime();
      this._saveMeasurement(this._updateReservoirs.brokerLatency, brokerLatency);
    }
    if (timestamps.serverProcessingStarted && timestamps.serverProcessingFinished) {
      let serverLatency = timestamps.serverProcessingFinished.getTime() - timestamps.serverProcessingStarted.getTime();
      this._saveMeasurement(this._updateReservoirs.serverLatency, serverLatency);
    }
    if (timestamps.serverProcessingFinished && timestamps.clientProcessingFinished) {
      let clientLatency = timestamps.clientProcessingFinished.getTime() - timestamps.serverProcessingFinished.getTime();
      this._saveMeasurement(this._updateReservoirs.clientLatency, clientLatency);
    }
  }

  /**
   * Returns update streaming latencies
   * @returns {Object} update streaming latencies
   */
  get updateLatencies() {
    return this._constructLatenciesRecursively(this._updateReservoirs);
  }

  /**
   * Invoked with latency information when application receives trade response
   * @param {string} accountId account id
   * @param {TradeTimestamps} timestamps timestamps object containing latency information about a trade
   */
  onTrade(accountId, timestamps) {
    if (timestamps.clientProcessingStarted && timestamps.serverProcessingStarted) {
      let clientLatency = timestamps.serverProcessingStarted.getTime() - timestamps.clientProcessingStarted.getTime();
      this._saveMeasurement(this._tradeReservoirs.clientLatency, clientLatency);
    }
    if (timestamps.serverProcessingStarted && timestamps.tradeStarted) {
      let serverLatency = timestamps.tradeStarted.getTime() - timestamps.serverProcessingStarted.getTime();
      this._saveMeasurement(this._tradeReservoirs.serverLatency, serverLatency);
    }
    if (timestamps.tradeStarted && timestamps.tradeExecuted) {
      let brokerLatency = timestamps.tradeExecuted.getTime() - timestamps.tradeStarted.getTime();
      this._saveMeasurement(this._tradeReservoirs.brokerLatency, brokerLatency);
    }
  }

  /**
   * Returns trade latencies
   * @returns {Object} trade latencies
   */
  get tradeLatencies() {
    return this._constructLatenciesRecursively(this._tradeReservoirs);
  }

  _saveMeasurement(reservoirs, clientLatency) {
    for (let e of Object.entries(reservoirs)) {
      if (e[0] === 'branch') {
        continue;
      }
      e[1].percentiles.pushMeasurement(clientLatency);
      e[1].reservoir.pushMeasurement(clientLatency);
    }
  }

  _constructLatenciesRecursively(reservoirs) {
    let result = {};
    for (let e of Object.entries(reservoirs)) {
      if (e[0] === 'branch') {
        continue;
      }
      result[e[0]] = e[1].branch ? this._constructLatenciesRecursively(e[1]) : {
        p50: e[1].percentiles.getPercentile(50),
        p75: e[1].percentiles.getPercentile(75),
        p90: e[1].percentiles.getPercentile(90),
        p95: e[1].percentiles.getPercentile(95),
        p98: e[1].percentiles.getPercentile(98),
        avg: e[1].reservoir.getStatistics().average,
        count: e[1].reservoir.getStatistics().count,
        min: e[1].reservoir.getStatistics().min,
        max: e[1].reservoir.getStatistics().max
      };
    }
    return result;
  }

  _initializeReservoirs() {
    return {
      branch: true,
      '1h': {
        percentiles: new StatisticalReservoir(1000, 60 * 60 * 1000),
        reservoir: new Reservoir(60, 60 * 60 * 1000)
      },
      '1d': {
        percentiles: new StatisticalReservoir(1000, 24 * 60 * 60 * 1000),
        reservoir: new Reservoir(60, 24 * 60 * 60 * 1000)
      },
      '1w': {
        percentiles: new StatisticalReservoir(1000, 7 * 24 * 60 * 60 * 1000),
        reservoir: new Reservoir(60, 7 * 24 * 60 * 60 * 1000)
      }
    };
  }

}
