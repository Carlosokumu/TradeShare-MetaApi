import HttpClient from "../httpClient";
import MetaApiClient from "../metaApi.client";
import { MetatraderCandle, MetatraderTick } from "./metaApiWebsocket.client";
import DomainClient from "../domain.client";

/**
 * metaapi.cloud historical market data API client
 */
export default class HistoricalMarketDataClient extends MetaApiClient {

  /**
   * Constructs historical market data API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {DomainClient} domainClient domain client
   */
  constructor(httpClient: HttpClient, domainClient: DomainClient);
  
  /**
   * Returns historical candles for a specific symbol and timeframe from a MetaTrader account.
   * See https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalCandles/
   * @param {string} accountId MetaTrader account id
   * @param {string} region account region
   * @param {string} symbol symbol to retrieve candles for (e.g. a currency pair or an index)
   * @param {string} timeframe defines the timeframe according to which the candles must be generated. Allowed values
   * for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed
   * values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {Date} [startTime] time to start loading candles from. Note that candles are loaded in backwards direction, so
   * this should be the latest time. Leave empty to request latest candles.
   * @param {number} [limit] maximum number of candles to retrieve. Must be less or equal to 1000
   * @return {Promise<Array<MetatraderCandle>>} promise resolving with historical candles downloaded
   */
  getHistoricalCandles(accountId: string, region: string, symbol: string, timeframe: string, startTime?: Date, limit?: number): Promise<Array<MetatraderCandle>>;
  
  /**
   * Returns historical ticks for a specific symbol from a MetaTrader account. This API is not supported by MT4
   * accounts.
   * See https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalTicks/
   * @param {string} accountId MetaTrader account id
   * @param {string} region account region
   * @param {string} symbol symbol to retrieve ticks for (e.g. a currency pair or an index)
   * @param {Date} [startTime] time to start loading ticks from. Note that candles are loaded in forward direction, so
   * this should be the earliest time. Leave empty to request latest candles.
   * @param {number} [offset] number of ticks to skip (you can use it to avoid requesting ticks from previous request
   * twice)
   * @param {number} [limit] maximum number of ticks to retrieve. Must be less or equal to 1000
   * @return {Promise<Array<MetatraderTick>>} promise resolving with historical ticks downloaded
   */
  getHistoricalTicks(accountId: string, region: string, symbol: string, startTime?: Date, offset?: number, limit?: number): Promise<Array<MetatraderTick>>;
}