/**
 * Receives notifications about server-side communication latencies
 */
export default class LatencyListener {
  
  /**
   * Invoked with latency information when application receives a response to RPC request
   * @param {string} accountId account id
   * @param {string} type request type
   * @param {ResponseTimestamps} timestamps request timestamps object containing latency information
   * @return {Promise} promise which resolves when latency information is processed
   */
  onResponse(accountId: string, type: string, timestamps: ResponseTimestamps): Promise<any>;
  
  /**
   * Invoked with latency information when application receives symbol price update event
   * @param {string} accountId account id
   * @param {string} symbol price symbol
   * @param {SymbolPriceTimestamps} timestamps timestamps object containing latency information about price streaming
   * @return {Promise} promise which resolves when latency information is processed
   */
  onSymbolPrice(accountId: string, symbol: string, timestamps: SymbolPriceTimestamps): Promise<any>;
  
  /**
   * Invoked with latency information when application receives update event
   * @param {string} accountId account id
   * @param {UpdateTimestamps} timestamps timestamps object containing latency information about update streaming
   * @return {Promise} promise which resolves when latency information is processed
   */
  onUpdate(accountId: string, timestamps: UpdateTimestamps): Promise<any>;
  
  /**
   * Invoked with latency information when application receives trade response
   * @param {string} accountId account id
   * @param {TradeTimestamps} timestamps timestamps object containing latency information about a trade
   * @return {Promise} promise which resolves when latency information is processed
   */
  onTrade(accountId: string, timestamps: TradeTimestamps): Promise<any>;
}

/**
 * Object containing request latency information
 */
export declare type ResponseTimestamps = {

  /**
   * time when request processing have started on client side
   */
  clientProcessingStarted: Date,

  /**
   * time when request processing have started on server side
   */
  serverProcessingStarted: Date,

  /**
   * time when request processing have finished on server side
   */
  serverProcessingFinished: Date,

  /**
   * time when request processing have finished on client side
   */
  clientProcessingFinished: Date
}

/**
 * Timestamps object containing latency information about price streaming
 */
export declare type SymbolPriceTimestamps = {

  /**
   * time the event was generated on exchange side
   */
  eventGenerated: Date,

  /**
   * time the event processing have started on server side
   */
  serverProcessingStarted: Date,

  /**
   * time the event processing have finished on server side
   */
  serverProcessingFinished: Date,

  /**
   * time the event processing have finished on client side
   */
  clientProcessingFinished: Date
}

/**
 * Timestamps object containing latency information about update streaming
 */
export declare type UpdateTimestamps = {

  /**
   * time the event was generated on exchange side
   */
  eventGenerated: Date,

  /**
   * time the event processing have started on server side
   */
  serverProcessingStarted: Date,

  /**
   * time the event processing have finished on server side
   */
  serverProcessingFinished: Date,

  /**
   * time the event processing have finished on client side
   */
  clientProcessingFinished: Date
}

/**
 * Timestamps object containing latency information about a trade
 */
export declare type TradeTimestamps = {

  /**
   * time when request processing have started on client side
   */
  clientProcessingStarted: Date,

  /**
   * time the event processing have started on server side
   */
  serverProcessingStarted: Date,

  /**
   * time the event processing have finished on server side
   */
  serverProcessingFinished: Date,

  /**
   * time the event processing have finished on client side
   */
  clientProcessingFinished: Date,

  /**
   * time the trade execution was started on server side
   */
  tradeStarted: Date,

  /**
   * time the trade was executed on exchange side
   */
  tradeExecuted: Date
}