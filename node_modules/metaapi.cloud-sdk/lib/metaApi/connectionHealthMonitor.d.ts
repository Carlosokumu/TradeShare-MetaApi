import { MetatraderSymbolPrice } from "../clients/metaApi/metaApiWebsocket.client";
import SynchronizationListener, { HealthStatus } from "../clients/metaApi/synchronizationListener";
import StreamingMetaApiConnection from "./streamingMetaApiConnection";

/**
 * Tracks connection health status
 */
export default class ConnectionHealthMonitor extends SynchronizationListener {
  
  /**
   * Constructs the listener
   * @param {StreamingMetaApiConnection} connection MetaApi connection instance
   */
  constructor(connection: StreamingMetaApiConnection);
  
  /**
   * Stops health monitor
   */
  stop(): void;
  
  /**
   * Invoked when a symbol price was updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderSymbolPrice} price updated MetaTrader symbol price
   */
  onSymbolPriceUpdated(instanceIndex: string, price: MetatraderSymbolPrice): Promise<any>;
  
  /**
   * Invoked when a server-side application health status is received from MetaApi
   * @param {string} instanceIndex index of an account instance connected
   * @param {HealthStatus} status server-side application health status
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHealthStatus(instanceIndex: string, status: HealthStatus): Promise<any>;
  
  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {string} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDisconnected(instanceIndex: string): Promise<any>;
  
  /**
   * Returns server-side application health status
   * @return {HealthStatus} server-side application health status
   */
  get serverHealthStatus(): HealthStatus;
  
  /**
   * Returns health status
   * @returns {ConnectionHealthStatus} connection health status
   */
  get healthStatus(): ConnectionHealthStatus;
  
  /**
   * Returns uptime in percents measured over specific periods of time
   * @returns {Object} uptime in percents measured over specific periods of time
   */
  get uptime(): Object;
}

/**
 * Connection health status
 */
export declare type ConnectionHealthStatus = {

  /**
   * flag indicating successful connection to API server
   */
  connected: boolean,

  /**
   * flag indicating successful connection to broker
   */
  connectedToBroker: boolean,

  /**
   * flag indicating that quotes are being streamed successfully from the
   * broker
   */
  quoteStreamingHealthy: boolean,

  /**
   * flag indicating a successful synchronization
   */
  synchronized: boolean,

  /**
   * flag indicating overall connection health status
   */
  healthy: boolean,

  /**
   * health status message
   */
  message: string
}