import LatencyListener, { ResponseTimestamps, SymbolPriceTimestamps, TradeTimestamps, UpdateTimestamps } from "../clients/metaApi/latencyListener";

/**
 * Responsible for monitoring MetaApi application latencies
 */
export default class LatencyMonitor extends LatencyListener {
  
  /**
   * Constructs latency monitor instance
   */
  constructor();
  
  /**
   * Invoked with latency information when application receives a response to RPC request
   * @param {string} accountId account id
   * @param {string} type request type
   * @param {ResponseTimestamps} timestamps request timestamps object containing latency information
   */
  onResponse(accountId: string, type: string, timestamps: ResponseTimestamps): Promise<any>;
  
  /**
   * Returns request processing latencies
   * @returns {Object} request processing latencies
   */
  get requestLatencies(): Object;
  
  /**
   * Invoked with latency information when application receives symbol price update event
   * @param {string} accountId account id
   * @param {string} symbol price symbol
   * @param {SymbolPriceTimestamps} timestamps timestamps object containing latency information about price streaming
   */
  onSymbolPrice(accountId: string, symbol: string, timestamps: SymbolPriceTimestamps): Promise<any>;
  
  /**
   * Returns price streaming latencies
   * @returns {Object} price streaming latencies
   */
  get priceLatencies(): Object;
  
  /**
   * Invoked with latency information when application receives update event
   * @param {string} accountId account id
   * @param {UpdateTimestamps} timestamps timestamps object containing latency information about update streaming
   */
  onUpdate(accountId: string, timestamps: UpdateTimestamps): Promise<any>;
  
  /**
   * Returns update streaming latencies
   * @returns {Object} update streaming latencies
   */
  get updateLatencies(): Object;
  
  /**
   * Invoked with latency information when application receives trade response
   * @param {string} accountId account id
   * @param {TradeTimestamps} timestamps timestamps object containing latency information about a trade
   */
  onTrade(accountId: string, timestamps: TradeTimestamps): Promise<any>;
  
  /**
   * Returns trade latencies
   * @returns {Object} trade latencies
   */
  get tradeLatencies(): Object;  
}