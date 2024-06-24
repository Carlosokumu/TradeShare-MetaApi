import MetatraderAccountApi from "./metatraderAccountApi"
import ProvisioningProfileApi from "./provisioningProfileApi"
import MetatraderAccountGeneratorApi from "./metatraderAccountGeneratorApi"
import LatencyMonitor from "./latencyMonitor"
import { SynchronizationThrottlerOpts } from "../clients/metaApi/synchronizationThrottler"
import { PacketLoggerOpts } from "../clients/metaApi/packetLogger"

/**
 * MetaApi MetaTrader API SDK
 */
export default class MetaApi {

  /**
   * Enables using Log4js logger with extended log levels for debugging instead of
   * console.* functions. Note that log4js configuration performed by the user.
   */
  static enableLog4jsLogging(): void;

  /**
   * Constructs MetaApi class instance
   * @param {string} token authorization token
   * @param {MetaApiOpts} opts application options
   */
  constructor(token: string, opts?: MetaApiOpts);

  /**
   * Returns provisioning profile API
   * @returns {ProvisioningProfileApi} provisioning profile API
   */
  get provisioningProfileApi(): ProvisioningProfileApi;

  /**
   * Returns MetaTrader account API
   * @return {MetatraderAccountApi} MetaTrader account API
   */
  get metatraderAccountApi(): MetatraderAccountApi;

  /**
   * Returns MetaTrader account generator API
   * @return {MetatraderAccountGeneratorApi} MetaTrader account generator API
   */
  get metatraderAccountGeneratorApi(): MetatraderAccountGeneratorApi;

  /**
   * Returns MetaApi application latency monitor
   * @return {LatencyMonitor} latency monitor
   */
  get latencyMonitor(): LatencyMonitor;

  /**
   * Closes all clients and connections
   */
  close(): void;
}

/**
 * MetaApi options
 */
export declare type MetaApiOpts = {

  /**
   * application id
   */
  application?: string,

  /**
   * domain to connect to, default is agiliumtrade.agiliumtrade.ai
   */
  domain?: string,

  /**
   * region to connect to
   */
  region?: string,

  /**
   * timeout for socket requests in seconds
   */
  requestTimeout?: number,

  /**
   * timeout for connecting to server in seconds
   */
  connectTimeout?: number,

  /**
   * packet ordering timeout in seconds
   */
  packetOrderingTimeout?: number,

  /**
   * packet logger options
   */
  packetLogger?: PacketLoggerOpts,

  /**
   * an option to enable latency tracking
   */
  enableLatencyMonitor?: boolean,

  /**
   * an option to enable latency tracking
   */
  enableLatencyTracking?: boolean,

  /**
   * options for synchronization throttler
   */
  synchronizationThrottler?: SynchronizationThrottlerOpts,

  /**
   * options for request retries
   */
  retryOpts?: RetryOpts,

  /**
   * option to use a shared server
   */
  useSharedClientApi?: boolean,

  /**
   * subscriptions refresh options
   */
  refreshSubscriptionsOpts?: RefreshSubscriptionsOpts,

  /**
   * a timeout in seconds for throttling repeat unsubscribe
   * requests when synchronization packets still arrive after unsubscription, default is 10 seconds
   */
  unsubscribeThrottlingIntervalInSeconds?: number,

  /**
   * MT account generator API request timeout. Default is 4 minutes
   */
  accountGeneratorRequestTimeout?: number
}

/**
 * Subscriptions refresh options
 */
export declare type RefreshSubscriptionsOpts = {

  /**
   * minimum delay in seconds until subscriptions refresh request,
   * default value is 1
   */
  minDelayInSeconds?: number,

  /**
   * maximum delay in seconds until subscriptions refresh request,
   * default value is 600
   */
  maxDelayInSeconds?: number
}

/**
 * Request retry options
 */
export declare type RetryOpts = {

  /**
   * maximum amount of request retries, default value is 5
   */
  retries?: number,

  /**
   * minimum delay in seconds until request retry, default value is 1
   */
  minDelayInSeconds?: number,

  /**
   * maximum delay in seconds until request retry, default value is 30
   */
  maxDelayInSeconds?: number
}