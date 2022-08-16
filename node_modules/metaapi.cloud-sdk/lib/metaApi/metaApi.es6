'use strict';

import HttpClient from '../clients/httpClient';
import ProvisioningProfileClient from '../clients/metaApi/provisioningProfile.client';
import ProvisioningProfileApi from './provisioningProfileApi';
import MetaApiWebsocketClient from '../clients/metaApi/metaApiWebsocket.client';
import MetatraderAccountApi from './metatraderAccountApi';
import MetatraderAccountClient from '../clients/metaApi/metatraderAccount.client';
import MetatraderAccountGeneratorApi from './metatraderAccountGeneratorApi';
import MetatraderAccountGeneratorClient from '../clients/metaApi/metatraderAccountGenerator.client';
import HistoricalMarketDataClient from '../clients/metaApi/historicalMarketData.client';
import ClientApiClient from '../clients/metaApi/clientApi.client';
import ConnectionRegistry from './connectionRegistry';
import {ValidationError} from '../clients/errorHandler';
import OptionsValidator from '../clients/optionsValidator';
import LatencyMonitor from './latencyMonitor';
import ExpertAdvisorClient from '../clients/metaApi/expertAdvisor.client';
import LoggerManager from '../logger';
import DomainClient from '../clients/domain.client';

/**
 * Request retry options
 * @typedef {Object} RetryOpts
 * @property {Number} [retries] maximum amount of request retries, default value is 5
 * @property {Number} [minDelayInSeconds] minimum delay in seconds until request retry, default value is 1
 * @property {Number} [maxDelayInSeconds] maximum delay in seconds until request retry, default value is 30
 */

/**
 * Subscriptions refresh options
 * @typedef {Object} RefreshSubscriptionsOpts
 * @property {Number} [minDelayInSeconds] minimum delay in seconds until subscriptions refresh request,
 * default value is 1
 * @property {Number} [maxDelayInSeconds] maximum delay in seconds until subscriptions refresh request,
 * default value is 600
 */

/**
 * MetaApi options
 * @typedef {Object} MetaApiOpts
 * @property {String} [application] application id
 * @property {String} [domain] domain to connect to, default is agiliumtrade.agiliumtrade.ai
 * @property {String} [region] region to connect to
 * @property {Number} [requestTimeout] timeout for socket requests in seconds
 * @property {Number} [connectTimeout] timeout for connecting to server in seconds
 * @property {Number} [packetOrderingTimeout] packet ordering timeout in seconds
 * @property {PacketLoggerOpts} [packetLogger] packet logger options
 * @property {Boolean} [enableLatencyMonitor] an option to enable latency tracking
 * @property {Boolean} [enableLatencyTracking] an option to enable latency tracking
 * @property {SynchronizationThrottlerOpts} [synchronizationThrottler] options for synchronization throttler
 * @property {RetryOpts} [retryOpts] options for request retries
 * @property {Boolean} [useSharedClientApi] option to use a shared server
 * @property {RefreshSubscriptionsOpts} [refreshSubscriptionsOpts] subscriptions refresh options
 * @property {Number} [unsubscribeThrottlingIntervalInSeconds] a timeout in seconds for throttling repeat unsubscribe
 * requests when synchronization packets still arrive after unsubscription, default is 10 seconds
 * @property {number} [accountGeneratorRequestTimeout] MT account generator API request timeout. Default is 4 minutes
 */

/**
 * MetaApi MetaTrader API SDK
 */
export default class MetaApi {

  /**
   * Enables using Log4js logger with extended log levels for debugging instead of
   * console.* functions. Note that log4js configuration performed by the user.
   */
  static enableLog4jsLogging() {
    LoggerManager.useLog4js();
  }

  /**
   * Constructs MetaApi class instance
   * @param {String} token authorization token
   * @param {MetaApiOpts} opts application options
   */
  // eslint-disable-next-line complexity
  constructor(token, opts) {
    const validator = new OptionsValidator();
    opts = opts || {};
    const application = opts.application || 'MetaApi';
    const domain = opts.domain || 'agiliumtrade.agiliumtrade.ai';
    const requestTimeout = validator.validateNonZero(opts.requestTimeout, 60, 'requestTimeout');
    const historicalMarketDataRequestTimeout = validator.validateNonZero(
      opts.historicalMarketDataRequestTimeout, 240, 'historicalMarketDataRequestTimeout');
    const connectTimeout = validator.validateNonZero(opts.connectTimeout, 60, 'connectTimeout');
    const packetOrderingTimeout = validator.validateNonZero(opts.packetOrderingTimeout, 60, 'packetOrderingTimeout');
    const retryOpts = opts.retryOpts || {};
    const packetLogger = opts.packetLogger || {};
    const synchronizationThrottler = opts.synchronizationThrottler || {};
    const accountGeneratorRequestTimeout = validator.validateNonZero(opts.accountGeneratorRequestTimeout, 240,
      'accountGeneratorRequestTimeout');
    if (!application.match(/[a-zA-Z0-9_]+/)) {
      throw new ValidationError('Application name must be non-empty string consisting from letters, digits and _ only');
    }
    const useSharedClientApi = opts.useSharedClientApi || false;
    const refreshSubscriptionsOpts = opts.refreshSubscriptionsOpts || {};
    const httpClient = new HttpClient(requestTimeout, retryOpts);
    const domainClient = new DomainClient(httpClient, token, domain);
    const historicalMarketDataHttpClient = new HttpClient(historicalMarketDataRequestTimeout, retryOpts);
    const accountGeneratorHttpClient = new HttpClient(accountGeneratorRequestTimeout, retryOpts);
    const clientApiClient = new ClientApiClient(httpClient, domainClient); 
    this._metaApiWebsocketClient = new MetaApiWebsocketClient(domainClient, token, {application, domain,
      requestTimeout, connectTimeout, packetLogger, packetOrderingTimeout, synchronizationThrottler, retryOpts,
      useSharedClientApi, region: opts.region,
      unsubscribeThrottlingIntervalInSeconds: opts.unsubscribeThrottlingIntervalInSeconds});
    this._provisioningProfileApi = new ProvisioningProfileApi(new ProvisioningProfileClient(httpClient, domainClient));
    this._connectionRegistry = new ConnectionRegistry(this._metaApiWebsocketClient, clientApiClient, application,
      refreshSubscriptionsOpts);
    let historicalMarketDataClient = new HistoricalMarketDataClient(historicalMarketDataHttpClient, domainClient);
    this._metatraderAccountApi = new MetatraderAccountApi(new MetatraderAccountClient(httpClient, domainClient),
      this._metaApiWebsocketClient, this._connectionRegistry, 
      new ExpertAdvisorClient(httpClient, domainClient), historicalMarketDataClient, application);
    this._metatraderAccountGeneratorApi = new MetatraderAccountGeneratorApi(
      new MetatraderAccountGeneratorClient(accountGeneratorHttpClient, domainClient));
    if (opts.enableLatencyTracking || opts.enableLatencyMonitor) {
      this._latencyMonitor = new LatencyMonitor();
      this._metaApiWebsocketClient.addLatencyListener(this._latencyMonitor);
    }
  }

  /**
   * Returns provisioning profile API
   * @returns {ProvisioningProfileApi} provisioning profile API
   */
  get provisioningProfileApi() {
    return this._provisioningProfileApi;
  }

  /**
   * Returns MetaTrader account API
   * @return {MetatraderAccountApi} MetaTrader account API
   */
  get metatraderAccountApi() {
    return this._metatraderAccountApi;
  }

  /**
   * Returns MetaTrader account generator API
   * @return {MetatraderDemoAccountApi} MetaTrader account generator API
   */
  get metatraderAccountGeneratorApi() {
    return this._metatraderAccountGeneratorApi;
  }

  /**
   * Returns MetaApi application latency monitor
   * @return {LatencyMonitor} latency monitor
   */
  get latencyMonitor() {
    return this._latencyMonitor;
  }

  /**
   * Closes all clients and connections
   */
  close() {
    this._metaApiWebsocketClient.removeLatencyListener(this._latencyMonitor);
    this._metaApiWebsocketClient.close();
  }

}
