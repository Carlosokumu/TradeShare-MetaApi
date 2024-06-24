'use strict';

import randomstring from 'randomstring';
import socketIO from 'socket.io-client';
import TimeoutError from '../timeoutError';
import {ValidationError, NotFoundError, InternalError, UnauthorizedError, TooManyRequestsError} from '../errorHandler';
import OptionsValidator from '../optionsValidator';
import NotSynchronizedError from './notSynchronizedError';
import NotConnectedError from './notConnectedError';
import TradeError from './tradeError';
import PacketOrderer from './packetOrderer';
import SynchronizationThrottler from './synchronizationThrottler';
import SubscriptionManager from './subscriptionManager';
import LoggerManager from '../../logger';
import any from 'promise.any';
import LatencyService from './latencyService';

let PacketLogger;
if (typeof window === 'undefined') { // don't import PacketLogger for browser version
  PacketLogger = require('./packetLogger').default;
}

/**
 * MetaApi websocket API client (see https://metaapi.cloud/docs/client/websocket/overview/)
 */
export default class MetaApiWebsocketClient {

  /**
   * Constructs MetaApi websocket API client instance
   * @param {DomainClient} domainClient domain client
   * @param {String} token authorization token
   * @param {Object} opts websocket client options
   */
  // eslint-disable-next-line complexity,max-statements
  constructor(domainClient, token, opts) {
    const validator = new OptionsValidator();
    opts = opts || {};
    opts.packetOrderingTimeout = validator.validateNonZero(opts.packetOrderingTimeout, 60, 'packetOrderingTimeout');
    opts.synchronizationThrottler = opts.synchronizationThrottler || {};
    this._domainClient = domainClient;
    this._application = opts.application || 'MetaApi';
    this._domain = opts.domain || 'agiliumtrade.agiliumtrade.ai';
    this._region = opts.region;
    this._hostname = 'mt-client-api-v1';
    this._url = null;
    this._requestTimeout = validator.validateNonZero(opts.requestTimeout, 60, 'requestTimeout') * 1000;
    this._connectTimeout = validator.validateNonZero(opts.connectTimeout, 60, 'connectTimeout') * 1000;
    const retryOpts = opts.retryOpts || {};
    this._retries = validator.validateNumber(retryOpts.retries, 5, 'retryOpts.retries');
    this._minRetryDelayInSeconds = validator.validateNonZero(retryOpts.minDelayInSeconds, 1,
      'retryOpts.minDelayInSeconds');
    this._maxRetryDelayInSeconds = validator.validateNonZero(retryOpts.maxDelayInSeconds, 30,
      'retryOpts.maxDelayInSeconds');
    this._maxAccountsPerInstance = 100;
    this._subscribeCooldownInSeconds = validator.validateNonZero(retryOpts.subscribeCooldownInSeconds, 600, 
      'retryOpts.subscribeCooldownInSeconds');
    this._sequentialEventProcessing = true;
    this._useSharedClientApi = validator.validateBoolean(opts.useSharedClientApi, false, 'useSharedClientApi');
    this._unsubscribeThrottlingInterval = validator.validateNonZero(opts.unsubscribeThrottlingIntervalInSeconds, 10,
      'unsubscribeThrottlingIntervalInSeconds') * 1000;
    this._socketMinimumReconnectTimeout = 500;
    this._latencyService = new LatencyService(this, token, this._connectTimeout);
    this._token = token;
    this._synchronizationListeners = {};
    this._latencyListeners = [];
    this._reconnectListeners = [];
    this._connectedHosts = {};
    this._socketInstances = {};
    this._socketInstancesByAccounts = {};
    this._regionsByAccounts = {};
    this._accountsByReplicaId = {};
    this._accountReplicas = {};
    this._synchronizationThrottlerOpts = opts.synchronizationThrottler;
    this._subscriptionManager = new SubscriptionManager(this);
    this._statusTimers = {};
    this._eventQueues = {};
    this._synchronizationFlags = {};
    this._synchronizationIdByInstance = {};
    this._subscribeLock = null;
    this._firstConnect = true;
    this._lastRequestsTime = {};
    this._packetOrderer = new PacketOrderer(this, opts.packetOrderingTimeout);
    this._packetOrderer.start();
    if(opts.packetLogger && opts.packetLogger.enabled) {
      this._packetLogger = new PacketLogger(opts.packetLogger);
      this._packetLogger.start();
    }
    this._logger = LoggerManager.getLogger('MetaApiWebsocketClient');
    this._clearAccountCacheJob = this._clearAccountCacheJob.bind(this);
    setInterval(this._clearAccountCacheJob, 30 * 60 * 1000);
  }

  /**
   * Restarts the account synchronization process on an out of order packet
   * @param {String} accountId account id
   * @param {Number} instanceIndex instance index
   * @param {Number} expectedSequenceNumber expected s/n
   * @param {Number} actualSequenceNumber actual s/n
   * @param {Object} packet packet data
   * @param {Date} receivedAt time the packet was received at
   */
  onOutOfOrderPacket(accountId, instanceIndex, expectedSequenceNumber, actualSequenceNumber, packet, receivedAt) {
    if (this._subscriptionManager.isSubscriptionActive(accountId)) {
      this._logger.error('MetaApi websocket client received an out of order ' +
        `packet type ${packet.type} for account id ${accountId}:${instanceIndex}. Expected s/n ` +
        `${expectedSequenceNumber} does not match the actual of ${actualSequenceNumber}`);
      this.ensureSubscribe(accountId, instanceIndex);
    }
  }

  /**
   * Patch server URL for use in unit tests
   * @param {String} url patched server URL
   */
  set url(url) {
    this._url = url;
  }

  /**
   * Websocket client predefined region
   * @returns {String} predefined region
   */
  get region() {
    return this._region;
  }

  /**
   * Returns the list of socket instance dictionaries
   * @return {Object[]} list of socket instance dictionaries
   */
  get socketInstances() {
    return this._socketInstances;
  }

  /**
   * Returns the dictionary of socket instances by account ids
   * @return {Object} dictionary of socket instances by account ids
   */
  get socketInstancesByAccounts() {
    return this._socketInstancesByAccounts;
  }

  /**
   * Returns the dictionary of account replicas by region
   * @return {Object} dictionary of account replicas by region
   */
  get accountReplicas() {
    return this._accountReplicas;
  }

  /**
   * Returns the dictionary of primary account ids by replica ids
   * @return {Object} dictionary of primary account ids by replica ids
   */
  get accountsByReplicaId() {
    return this._accountsByReplicaId;
  }

  /**
   * Returns the list of subscribed account ids
   * @param {Number} instanceNumber instance index number
   * @param {String} socketInstanceIndex socket instance index
   * @param {String} region server region
   * @return {string[]} list of subscribed account ids
   */
  subscribedAccountIds(instanceNumber, socketInstanceIndex, region) {
    const connectedIds = [];
    if(this._socketInstancesByAccounts[instanceNumber]) {
      Object.keys(this._connectedHosts).forEach(instanceId => {
        const accountId = instanceId.split(':')[0];
        const accountRegion = this.getAccountRegion(accountId);
        if(!connectedIds.includes(accountId) && 
        this._socketInstancesByAccounts[instanceNumber][accountId] !== undefined && (
          this._socketInstancesByAccounts[instanceNumber][accountId] === socketInstanceIndex || 
        socketInstanceIndex === undefined) && accountRegion === region) {
          connectedIds.push(accountId);
        }
      });
    }
    return connectedIds;
  }

  /**
   * Returns websocket client connection status
   * @param {Number} instanceNumber instance index number
   * @param {Number} socketInstanceIndex socket instance index
   * @param {String} region server region
   * @returns {Boolean} websocket client connection status
   */
  connected(instanceNumber, socketInstanceIndex, region) {
    const instance = this._socketInstances[region] && 
      this._socketInstances[region][instanceNumber].length > socketInstanceIndex ? 
      this._socketInstances[region][instanceNumber][socketInstanceIndex] : null;
    return (instance && instance.socket && instance.socket.connected) || false;
  }

  /**
   * Returns list of accounts assigned to instance
   * @param {Number} instanceNumber instance index number
   * @param {String} socketInstanceIndex socket instance index
   * @param {String} region server region
   * @returns 
   */
  getAssignedAccounts(instanceNumber, socketInstanceIndex, region) {
    const accountIds = [];
    Object.keys(this._socketInstancesByAccounts[instanceNumber]).forEach(key => {
      const accountRegion = this.getAccountRegion(key);
      if (accountRegion === region &&
        this._socketInstancesByAccounts[instanceNumber][key] === socketInstanceIndex) {
        accountIds.push(key);
      }
    });
    return accountIds;
  }

  /**
   * Returns account region by id
   * @param {String} accountId account id
   * @returns {String} account region
   */
  getAccountRegion(accountId) {
    return this._regionsByAccounts[accountId] && this._regionsByAccounts[accountId].region;
  }

  /**
   * Adds account cache info
   * @param {String} accountId account id
   * @param {Object} replicas account replicas
   */
  addAccountCache(accountId, replicas) {
    this._accountReplicas[accountId] = replicas;
    Object.keys(replicas).forEach(region => {
      const replicaId = replicas[region];
      if(!this._regionsByAccounts[replicaId]) {
        this._regionsByAccounts[replicaId] = {
          region,
          connections: 1,
          lastUsed: Date.now()
        };
      } else {
        this._regionsByAccounts[replicaId].connections++;
      }
      this._accountsByReplicaId[replicaId] = accountId;
    });
  }

  /**
   * Removes account region info
   * @param {String} accountId account id
   */
  removeAccountCache(accountId) {
    if(this._regionsByAccounts[accountId]) {
      if(this._regionsByAccounts[accountId].connections > 0) {
        this._regionsByAccounts[accountId].connections--; 
      }
    }
  }

  /**
   * Locks subscription for a socket instance based on TooManyRequestsError metadata
   * @param {Number} instanceNumber instance index number
   * @param {String} socketInstanceIndex socket instance index
   * @param {String} region server region
   * @param {Object} metadata TooManyRequestsError metadata
   */
  async lockSocketInstance(instanceNumber, socketInstanceIndex, region, metadata) {
    if (metadata.type === 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER') {
      this._subscribeLock = {
        recommendedRetryTime: metadata.recommendedRetryTime,
        lockedAtAccounts: this.subscribedAccountIds(instanceNumber, undefined, region).length,
        lockedAtTime: Date.now()
      };
    } else {
      const subscribedAccounts = this.subscribedAccountIds(instanceNumber, socketInstanceIndex, region);
      if (subscribedAccounts.length === 0) {
        const socketInstance = this.socketInstances[region][instanceNumber][socketInstanceIndex];
        socketInstance.socket.close();
        await this._reconnect(instanceNumber, socketInstanceIndex, region);
      } else {
        const instance = this.socketInstances[region][instanceNumber][socketInstanceIndex];
        instance.subscribeLock = {
          recommendedRetryTime: metadata.recommendedRetryTime,
          type: metadata.type,
          lockedAtAccounts: subscribedAccounts.length
        };
      }
    }
  }

  /**
   * Connects to MetaApi server via socket.io protocol
   * @param {Number} instanceNumber instance index number
   * @param {String} region server region
   * @returns {Promise} promise which resolves when connection is established
   */
  async connect(instanceNumber, region) {
    let clientId = Math.random();
    let resolve;
    let result = new Promise((res, rej) => {
      resolve = res;
    });
    const socketInstanceIndex = this._socketInstances[region][instanceNumber].length;
    const instance = {
      id: socketInstanceIndex,
      reconnectWaitTime: this._socketMinimumReconnectTimeout,
      connected: false,
      requestResolves: {},
      resolved: false,
      connectResult: result,
      sessionId: randomstring.generate(32),
      isReconnecting: false,
      socket: null,
      synchronizationThrottler: new SynchronizationThrottler(this, socketInstanceIndex, instanceNumber, region,
        this._synchronizationThrottlerOpts),
      subscribeLock: null,
      instanceNumber
    };
    instance.connected = true;
    this._socketInstances[region][instanceNumber].push(instance);
    instance.synchronizationThrottler.start();
    const serverUrl = await this._getServerUrl(instanceNumber, socketInstanceIndex, region);
    const socketInstance = socketIO(serverUrl, {
      path: '/ws',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: this._connectTimeout,
      extraHeaders: {
        'Client-Id': clientId
      },
      query: {
        'auth-token': this._token,
        clientId: clientId,
        protocol: 3
      }
    });
    instance.socket = socketInstance;
    socketInstance.on('connect', async () => {
      // eslint-disable-next-line no-console
      this._logger.info(`${region}:${instanceNumber}: MetaApi websocket client connected to the MetaApi server`);
      instance.reconnectWaitTime = this._socketMinimumReconnectTimeout;
      instance.isReconnecting = false;
      if (!instance.resolved) {
        instance.resolved = true;
        resolve();
      } else {
        await this._fireReconnected(instanceNumber, instance.id, region);
      }
      if (!instance.connected) {
        instance.socket.close();
      }
    });
    socketInstance.on('reconnect', async () => {
      instance.isReconnecting = false;
      this._logger.info(`${region}:${instanceNumber}: MetaApi websocket client reconnected`);
      await this._fireReconnected(instanceNumber, instance.id, region);
    });
    socketInstance.on('connect_error', async (err) => {
      // eslint-disable-next-line no-console
      this._logger.error(`${region}:${instanceNumber}: MetaApi websocket client connection error`, err);
      instance.isReconnecting = false;
      if (!instance.resolved) {
        await this._reconnect(instanceNumber, instance.id, region);
      }
    });
    socketInstance.on('connect_timeout', async (timeout) => {
      // eslint-disable-next-line no-console
      this._logger.error(`${region}:${instanceNumber}: MetaApi websocket client connection timeout`);
      instance.isReconnecting = false;
      if (!instance.resolved) {
        await this._reconnect(instanceNumber, instance.id, region);
      }
    });
    socketInstance.on('disconnect', async (reason) => {
      instance.synchronizationThrottler.onDisconnect();
      // eslint-disable-next-line no-console
      this._logger.info(`${region}:${instanceNumber}: MetaApi websocket client disconnected from the ` +
        `MetaApi server because of ${reason}`);
      instance.isReconnecting = false;
      await this._reconnect(instanceNumber, instance.id, region);
    });
    socketInstance.on('error', async (error) => {
      // eslint-disable-next-line no-console
      this._logger.error(`${region}:${instanceNumber}: MetaApi websocket client error`, error);
      instance.isReconnecting = false;
      await this._reconnect(instanceNumber, instance.id, region);
    });
    socketInstance.on('response', data => {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      this._logger.debug(() => `${data.accountId}: Response received: ${JSON.stringify({
        requestId: data.requestId, timestamps: data.timestamps})}`);
      let requestResolve = (instance.requestResolves[data.requestId] || {resolve: () => {}, reject: () => {}});
      delete instance.requestResolves[data.requestId];
      this._convertIsoTimeToDate(data);
      requestResolve.resolve(data);
      if (data.timestamps && requestResolve.type) {
        data.timestamps.clientProcessingFinished = new Date();
        for (let listener of this._latencyListeners) {
          Promise.resolve()
            .then(() => requestResolve.type === 'trade' ?
              listener.onTrade(data.accountId, data.timestamps) :
              listener.onResponse(data.accountId, requestResolve.type, data.timestamps))
            .catch(error => this._logger.error('Failed to process onResponse event for account ' +
              data.accountId + ', request type ' + requestResolve.type, error));
        }
      }
    });
    socketInstance.on('processingError', data => {
      let requestResolve = (instance.requestResolves[data.requestId] || {resolve: () => {}, reject: () => {}});
      delete instance.requestResolves[data.requestId];
      requestResolve.reject(this._convertError(data));
    });
    // eslint-disable-next-line complexity
    socketInstance.on('synchronization', async data => {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (data.instanceIndex && data.instanceIndex !== instanceNumber) {
        this._logger.trace(() => `${data.accountId}:${data.instanceNumber}: received packet with wrong instance ` +
          `index via a socket with instance number of ${instanceNumber}, data=${JSON.stringify({
            type: data.type, sequenceNumber: data.sequenceNumber, sequenceTimestamp: data.sequenceTimestamp,
            synchronizationId: data.synchronizationId, application: data.application, host: data.host,
            specificationsUpdated: data.specificationsUpdated, positionsUpdated: data.positionsUpdated,
            ordersUpdated: data.ordersUpdated,
            specifications: data.specifications ? (data.specifications || []).length : undefined})}`);
        return;
      }
      if(!this._regionsByAccounts[data.accountId]) {
        this._regionsByAccounts[data.accountId] = {region, connections: 0, lastUsed: Date.now()};
      }
      this._logger.trace(() => `${data.accountId}:${data.instanceIndex}: Sync packet received: ${JSON.stringify({
        type: data.type, sequenceNumber: data.sequenceNumber, sequenceTimestamp: data.sequenceTimestamp,
        synchronizationId: data.synchronizationId, application: data.application, host: data.host, 
        specificationsUpdated: data.specificationsUpdated, positionsUpdated: data.positionsUpdated,
        ordersUpdated: data.ordersUpdated, 
        specifications: data.specifications ? (data.specifications || []).length : undefined})}, ` +
        `active listeners: ${(this._synchronizationListeners[data.accountId] || []).length}`);
      let activeSynchronizationIds = instance.synchronizationThrottler.activeSynchronizationIds; 
      if (!data.synchronizationId || activeSynchronizationIds.includes(data.synchronizationId)) {
        if (this._packetLogger) {
          await this._packetLogger.logPacket(data);
        }
        const ignoredPacketTypes = ['disconnected', 'status', 'keepalive'];
        if (!this._subscriptionManager.isSubscriptionActive(data.accountId) && 
          !ignoredPacketTypes.includes(data.type)) {
          this._logger.debug(`${data.accountId}: Packet arrived to inactive connection, attempting` +
            ` unsubscribe, packet: ${data.type}`);
          if (this._throttleRequest('unsubscribe', data.accountId, data.instanceIndex, 
            this._unsubscribeThrottlingInterval)) {
            this.unsubscribe(data.accountId).catch(err => {
              this._logger.warn(`${data.accountId}:${data.instanceIndex || 0}: failed to unsubscribe`, err);
            });
          }
          return;
        }
        this._convertIsoTimeToDate(data);
      } else {
        data.type = 'noop';
      }
      this.queuePacket(data);
    });
    return result;
  }

  /**
   * Closes connection to MetaApi server
   */
  close() {
    Object.keys(this._socketInstances).forEach(region => {
      Object.keys(this._socketInstances[region]).forEach(instanceNumber => {
        this._socketInstances[region][instanceNumber].forEach(async (instance) => {
          if (instance.connected) {
            instance.connected = false;
            await instance.socket.close();
            for (let requestResolve of Object.values(instance.requestResolves)) {
              requestResolve.reject(new Error('MetaApi connection closed'));
            }
            instance.requestResolves = {};
          }
        });
        this._socketInstancesByAccounts[instanceNumber] = {};
        this._socketInstances[region][instanceNumber] = [];
      });
    });
    this._synchronizationListeners = {};
    this._latencyListeners = [];
    this._packetOrderer.stop();
  }

  /**
   * MetaTrader account information (see https://metaapi.cloud/docs/client/models/metatraderAccountInformation/)
   * @typedef {Object} MetatraderAccountInformation
   * @property {String} platform platform id (mt4 or mt5)
   * @property {String} broker broker name
   * @property {String} currency account base currency ISO code
   * @property {String} server broker server name
   * @property {Number} balance account balance
   * @property {Number} equity account liquidation value
   * @property {Number} margin used margin
   * @property {Number} freeMargin free margin
   * @property {Number} leverage account leverage coefficient
   * @property {Number} marginLevel margin level calculated as % of equity/margin
   * @property {Boolean} tradeAllowed flag indicating that trading is allowed
   * @property {Boolean} [investorMode] flag indicating that investor password was used (supported for g2 only)
   * @property {String} marginMode margin calculation mode, one of ACCOUNT_MARGIN_MODE_EXCHANGE,
   * ACCOUNT_MARGIN_MODE_RETAIL_NETTING, ACCOUNT_MARGIN_MODE_RETAIL_HEDGING
   * @property {String} name Account owner name
   * @property {Number} login Account login
   * @property {Number} credit Account credit in the deposit currency
   * @property {number} accountCurrencyExchangeRate current exchange rate of account currency into account base currency
   * (USD if you did not override it)
   */

  /**
   * Returns account information for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readAccountInformation/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @returns {Promise<MetatraderAccountInformation>} promise resolving with account information
   */
  async getAccountInformation(accountId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getAccountInformation'});
    return response.accountInformation;
  }

  /**
   * Stop loss threshold
   * @typedef {Object} StopLossThreshold
   * @property {Number} threshold price threshold relative to position open price, interpreted according to units
   * field value
   * @property {Number} stopLoss stop loss value, interpreted according to units and basePrice field values
   */

  /**
   * Threshold trailing stop loss configuration
   * @typedef {Object} ThresholdTrailingStopLoss
   * @property {StopLossThreshold[]} thresholds stop loss thresholds
   * @property {String} [units] threshold stop loss units. ABSOLUTE_PRICE means the that the value of stop loss
   * threshold fields contain a final threshold & stop loss value. RELATIVE* means that the threshold fields value
   * contains relative threshold & stop loss values, expressed either in price, points, pips, account currency or
   * balance percentage. Default is ABSOLUTE_PRICE. One of ABSOLUTE_PRICE, RELATIVE_PRICE, RELATIVE_POINTS,
   * RELATIVE_PIPS, RELATIVE_CURRENCY, RELATIVE_BALANCE_PERCENTAGE
   * @property {String} [stopPriceBase] defined the base price to calculate SL relative to for POSITION_MODIFY and
   * pending order requests. Default is OPEN_PRICE. One of CURRENT_PRICE, OPEN_PRICE
   */

  /**
   * Distance trailing stop loss configuration
   * @typedef {Object} DistanceTrailingStopLoss
   * @property {Number} [distance] SL distance relative to current price, interpreted according to units field value
   * @property {String} [units] distance trailing stop loss units. RELATIVE_* means that the distance field value 
   * contains relative stop loss expressed either in price, points, pips, account currency or balance percentage. 
   * Default is RELATIVE_PRICE. One of RELATIVE_PRICE, RELATIVE_POINTS, RELATIVE_PIPS, RELATIVE_CURRENCY,
   * RELATIVE_BALANCE_PERCENTAGE
   */

  /**
   * Distance trailing stop loss configuration
   * @typedef {Object} TrailingStopLoss
   * @property {DistanceTrailingStopLoss} [distance] distance trailing stop loss configuration. If both distance and
   * threshold TSL are set, then the resulting SL will be the one which is closest to the current price
   * @property {ThresholdTrailingStopLoss} [threshold] distance trailing stop loss configuration. If both distance and
   * threshold TSL are set, then the resulting SL will be the one which is closest to the current price
   */

  /**
   * MetaTrader position
   * @typedef {Object} MetatraderPosition
   * @property {Number} id position id (ticket number)
   * @property {String} type position type (one of POSITION_TYPE_BUY, POSITION_TYPE_SELL)
   * @property {String} symbol position symbol
   * @property {Number} magic position magic number, identifies the EA which opened the position
   * @property {Date} time time position was opened at
   * @property {String} brokerTime time position was opened at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Date} updateTime last position modification time
   * @property {Number} openPrice position open price
   * @property {Number} currentPrice current price
   * @property {Number} currentTickValue current tick value
   * @property {Number} [stopLoss] optional position stop loss price
   * @property {Number} [takeProfit] optional position take profit price
   * @property {TrailingStopLoss} [trailingStopLoss] distance trailing stop loss configuration
   * @property {Number} volume position volume
   * @property {Number} profit position cumulative profit, including unrealized profit resulting from currently open
   * position part (except swap and commissions) and realized profit resulting from partially closed position part
   * and including swap and commissions
   * @property {Number} realizedProfit profit of the already closed part, including commissions and swap (realized and
   * unrealized)
   * @property {Number} unrealizedProfit profit of the part of the position which is not yet closed, excluding swap and
   * commissions
   * @property {Number} swap position cumulative swap, including both swap from currently open position part (unrealized
   * swap) and swap from partially closed position part (realized swap)
   * @property {Number} realizedSwap swap from partially closed position part
   * @property {Number} unrealizedSwap swap resulting from currently open position part
   * @property {Number} commission total position commissions, resulting both from currently open and closed position
   * parts
   * @property {Number} realizedCommission position realized commission, resulting from partially closed position part
   * @property {Number} unrealizedCommission position unrealized commission, resulting from currently open position part
   * @property {String} [comment] optional position comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} [clientId] optional client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} reason position opening reason. One of POSITION_REASON_CLIENT, POSITION_REASON_EXPERT,
   * POSITION_REASON_MOBILE, POSITION_REASON_WEB, POSITION_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/positionproperties#enum_position_reason',
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   * @property {String} [brokerComment] current comment value on broker side (possibly overriden by the broker)
   */

  /**
   * Returns positions for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPositions/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @returns {Promise<Array<MetatraderPosition>} promise resolving with array of open positions
   */
  async getPositions(accountId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getPositions'});
    return response.positions;
  }

  /**
   * Returns specific position for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readPosition/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @return {Promise<MetatraderPosition>} promise resolving with MetaTrader position found
   */
  async getPosition(accountId, positionId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getPosition', positionId});
    return response.position;
  }

  /**
   * MetaTrader order
   * @typedef {Object} MetatraderOrder
   * @property {Number} id order id (ticket number)
   * @property {String} type order type (one of ORDER_TYPE_SELL, ORDER_TYPE_BUY, ORDER_TYPE_BUY_LIMIT,
   * ORDER_TYPE_SELL_LIMIT, ORDER_TYPE_BUY_STOP, ORDER_TYPE_SELL_STOP). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type
   * @property {String} state order state one of (ORDER_STATE_STARTED, ORDER_STATE_PLACED, ORDER_STATE_CANCELED,
   * ORDER_STATE_PARTIAL, ORDER_STATE_FILLED, ORDER_STATE_REJECTED, ORDER_STATE_EXPIRED, ORDER_STATE_REQUEST_ADD,
   * ORDER_STATE_REQUEST_MODIFY, ORDER_STATE_REQUEST_CANCEL). See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_state
   * @property {Number} magic order magic number, identifies the EA which created the order
   * @property {Date} time time order was created at
   * @property {String} brokerTime time time order was created at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Date} [doneTime] time order was executed or canceled at. Will be specified for
   * completed orders only
   * @property {String} [doneBrokerTime] time order was executed or canceled at, in broker timezone,
   * YYYY-MM-DD HH:mm:ss.SSS format. Will be specified for completed orders only
   * @property {String} symbol order symbol
   * @property {Number} openPrice order open price (market price for market orders, limit price for limit orders or stop
   * price for stop orders)
   * @property {Number} [currentPrice] current price, filled for pending orders only. Not filled for history orders.
   * @property {Number} [stopLoss] order stop loss price
   * @property {Number} [takeProfit] order take profit price
   * @property {TrailingStopLoss} [trailingStopLoss] distance trailing stop loss configuration
   * @property {Number} volume order requested quantity
   * @property {Number} currentVolume order remaining quantity, i.e. requested quantity - filled quantity
   * @property {String} positionId order position id. Present only if the order has a position attached to it
   * @property {String} [comment] order comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} [brokerComment] current comment value on broker side (possibly overriden by the broker)
   * @property {String} [clientId] client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} platform platform id (mt4 or mt5)
   * @property {String} reason order opening reason. One of ORDER_REASON_CLIENT, ORDER_REASON_MOBILE, ORDER_REASON_WEB,
   * ORDER_REASON_EXPERT, ORDER_REASON_SL, ORDER_REASON_TP, ORDER_REASON_SO, ORDER_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_reason.
   * @property {String} fillingMode order filling mode. One of ORDER_FILLING_FOK, ORDER_FILLING_IOC,
   * ORDER_FILLING_RETURN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_filling.
   * @property {String} expirationType order expiration type. One of ORDER_TIME_GTC, ORDER_TIME_DAY,
   * ORDER_TIME_SPECIFIED, ORDER_TIME_SPECIFIED_DAY. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/orderproperties#enum_order_type_time
   * @property {Date} expirationTime optional order expiration time
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   * @property {String} [closeByPositionId] identifier of an opposite position used for closing by order
   * ORDER_TYPE_CLOSE_BY
   * @property {Number} [stopLimitPrice] the Limit order price for the StopLimit order
   */

  /**
   * Returns open orders for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrders/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @return {Promise<Array<MetatraderOrder>>} promise resolving with open MetaTrader orders
   */
  async getOrders(accountId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getOrders'});
    return response.orders;
  }

  /**
   * Returns specific open order for a MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readOrder/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} orderId order id (ticket number)
   * @return {Promise<MetatraderOrder>} promise resolving with metatrader order found
   */
  async getOrder(accountId, orderId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getOrder', orderId});
    return response.order;
  }

  /**
   * MetaTrader history orders search query response
   * @typedef {Object} MetatraderHistoryOrders
   * @property {Array<MetatraderOrder>} historyOrders array of history orders returned
   * @property {Boolean} synchronizing flag indicating that history order initial synchronization is still in progress
   * and thus search results may be incomplete
   */

  /**
   * Returns the history of completed orders for a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTicket/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} ticket ticket number (order id)
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  async getHistoryOrdersByTicket(accountId, ticket) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getHistoryOrdersByTicket', ticket});
    return {
      historyOrders: response.historyOrders,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Returns the history of completed orders for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByPosition/)
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  async getHistoryOrdersByPosition(accountId, positionId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getHistoryOrdersByPosition',
      positionId});
    return {
      historyOrders: response.historyOrders,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Returns the history of completed orders for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readHistoryOrdersByTimeRange/)
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderHistoryOrders>} promise resolving with request results containing history orders found
   */
  async getHistoryOrdersByTimeRange(accountId, startTime, endTime, offset = 0, limit = 1000) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getHistoryOrdersByTimeRange',
      startTime, endTime, offset, limit});
    return {
      historyOrders: response.historyOrders,
      synchronizing: response.synchronizing
    };
  }

  /**
   * MetaTrader history deals search query response
   * @typedef {Object} MetatraderDeals
   * @property {Array<MetatraderDeal>} deals array of history deals returned
   * @property {Boolean} synchronizing flag indicating that deal initial synchronization is still in progress
   * and thus search results may be incomplete
   */

  /**
   * MetaTrader deal
   * @typedef {Object} MetatraderDeal
   * @property {String} id deal id (ticket number)
   * @property {String} type deal type (one of DEAL_TYPE_BUY, DEAL_TYPE_SELL, DEAL_TYPE_BALANCE, DEAL_TYPE_CREDIT,
   * DEAL_TYPE_CHARGE, DEAL_TYPE_CORRECTION, DEAL_TYPE_BONUS, DEAL_TYPE_COMMISSION, DEAL_TYPE_COMMISSION_DAILY,
   * DEAL_TYPE_COMMISSION_MONTHLY, DEAL_TYPE_COMMISSION_AGENT_DAILY, DEAL_TYPE_COMMISSION_AGENT_MONTHLY,
   * DEAL_TYPE_INTEREST, DEAL_TYPE_BUY_CANCELED, DEAL_TYPE_SELL_CANCELED, DEAL_DIVIDEND, DEAL_DIVIDEND_FRANKED,
   * DEAL_TAX). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_type
   * @property {String} entryType deal entry type (one of DEAL_ENTRY_IN, DEAL_ENTRY_OUT, DEAL_ENTRY_INOUT,
   * DEAL_ENTRY_OUT_BY). See https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_entry
   * @property {String} [symbol] symbol deal relates to
   * @property {Number} [magic] deal magic number, identifies the EA which initiated the deal
   * @property {Date} time time the deal was conducted at
   * @property {String} brokerTime time time the deal was conducted at, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Number} [volume] deal volume
   * @property {Number} [price] the price the deal was conducted at
   * @property {Number} [commission] deal commission
   * @property {Number} [swap] deal swap
   * @property {Number} profit deal profit
   * @property {String} [positionId] id of position the deal relates to
   * @property {String} [orderId] id of order the deal relates to
   * @property {String} [comment] deal comment. The sum of the line lengths of the comment and the clientId
   * must be less than or equal to 26. For more information see https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} [brokerComment] current comment value on broker side (possibly overriden by the broker)
   * @property {String} [clientId] client-assigned id. The id value can be assigned when submitting a trade and
   * will be present on position, history orders and history deals related to the trade. You can use this field to bind
   * your trades to objects in your application and then track trade progress. The sum of the line lengths of the
   * comment and the clientId must be less than or equal to 26. For more information see
   * https://metaapi.cloud/docs/client/clientIdUsage/
   * @property {String} platform platform id (mt4 or mt5)
   * @property {String} [reason] optional deal execution reason. One of DEAL_REASON_CLIENT, DEAL_REASON_MOBILE,
   * DEAL_REASON_WEB, DEAL_REASON_EXPERT, DEAL_REASON_SL, DEAL_REASON_TP, DEAL_REASON_SO, DEAL_REASON_ROLLOVER,
   * DEAL_REASON_VMARGIN, DEAL_REASON_SPLIT, DEAL_REASON_UNKNOWN. See
   * https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties#enum_deal_reason.
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   * @property {number} [stopLoss] deal stop loss. For MT5 opening deal this is the SL of the order opening the 
   * position. For MT4 deals or MT5 closing deal this is the last known position SL.
   * @property {number} [takeProfit] deal take profit. For MT5 opening deal this is the TP of the order opening the 
   * position. For MT4 deals or MT5 closing deal this is the last known position TP.
   */

  /**
   * Returns history deals with a specific ticket number (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTicket/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} ticket ticket number (deal id for MT5 or order id for MT4)
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  async getDealsByTicket(accountId, ticket) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getDealsByTicket', ticket});
    return {
      deals: response.deals,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Returns history deals for a specific position id (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByPosition/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {String} positionId position id
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  async getDealsByPosition(accountId, positionId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getDealsByPosition', positionId});
    return {
      deals: response.deals,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Returns history deals with for a specific time range (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveHistoricalData/readDealsByTimeRange/).
   * @param {String} accountId id of the MetaTrader account to return information for
   * @param {Date} startTime start of time range, inclusive
   * @param {Date} endTime end of time range, exclusive
   * @param {Number} offset pagination offset, default is 0
   * @param {Number} limit pagination limit, default is 1000
   * @returns {Promise<MetatraderDeals>} promise resolving with request results containing deals found
   */
  async getDealsByTimeRange(accountId, startTime, endTime, offset = 0, limit = 1000) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getDealsByTimeRange', startTime,
      endTime, offset, limit});
    return {
      deals: response.deals,
      synchronizing: response.synchronizing
    };
  }

  /**
   * Clears the order and transaction history of a specified application and removes the application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @param {String} accountId id of the MetaTrader account to remove history and application for
   * @return {Promise} promise resolving when the history is cleared
   */
  removeApplication(accountId) {
    return this.rpcRequest(accountId, {type: 'removeApplication'});
  }

  /**
   * MetaTrader trade response
   * @typedef {Object} MetatraderTradeResponse
   * @property {Number} numericCode numeric response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are 0, 10008-10010, 10025. The rest
   * codes are errors
   * @property {String} stringCode string response code, see
   * https://www.mql5.com/en/docs/constants/errorswarnings/enum_trade_return_codes and
   * https://book.mql4.com/appendix/errors. Response codes which indicate success are ERR_NO_ERROR,
   * TRADE_RETCODE_PLACED, TRADE_RETCODE_DONE, TRADE_RETCODE_DONE_PARTIAL, TRADE_RETCODE_NO_CHANGES. The rest codes are
   * errors.
   * @property {String} message human-readable response message
   * @property {String} orderId order id which was created/modified during the trade
   * @property {String} positionId position id which was modified during the trade
   */

  /**
   * Execute a trade on a connected MetaTrader account (see https://metaapi.cloud/docs/client/websocket/api/trade/).
   * @param {String} accountId id of the MetaTrader account to execute trade for
   * @param {MetatraderTrade} trade trade to execute (see docs for possible trade types)
   * @param {String} [application] application to use
   * @param {String} [reliability] account reliability
   * @returns {Promise<MetatraderTradeResponse>} promise resolving with trade result
   * @throws {TradeError} on trade error, check error properties for error code details
   */
  // eslint-disable-next-line complexity
  async trade(accountId, trade, application, reliability) {
    let response;
    if(application === 'RPC') {
      response = await this.rpcRequest(accountId, {type: 'trade', trade, application});
    } else {
      response = await this.rpcRequestAllInstances(accountId, {type: 'trade', trade,
        application: application || this._application, requestId: randomstring.generate(32)}, reliability);
    }
    response.response = response.response || {};
    response.response.stringCode = response.response.stringCode || response.response.description;
    response.response.numericCode = response.response.numericCode !== undefined ? response.response.numericCode :
      response.response.error;
    if (['ERR_NO_ERROR', 'TRADE_RETCODE_PLACED', 'TRADE_RETCODE_DONE', 'TRADE_RETCODE_DONE_PARTIAL',
      'TRADE_RETCODE_NO_CHANGES'].includes(response.response.stringCode || response.response.description)) {
      return response.response;
    } else {
      throw new TradeError(response.response.message, response.response.numericCode, response.response.stringCode);
    }
  }

  /**
   * Creates a task that ensures the account gets subscribed to the server
   * @param {String} accountId account id to subscribe
   * @param {Number} instanceNumber instance index number
   */
  ensureSubscribe(accountId, instanceNumber) {
    this._subscriptionManager.scheduleSubscribe(accountId, instanceNumber);
  }

  /**
   * Subscribes to the Metatrader terminal events (see https://metaapi.cloud/docs/client/websocket/api/subscribe/).
   * @param {String} accountId id of the MetaTrader account to subscribe to
   * @param {Number} instanceNumber instance index number
   * @returns {Promise} promise which resolves when subscription started
   */
  subscribe(accountId, instanceNumber) {
    return this._subscriptionManager.subscribe(accountId, instanceNumber);
  }

  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/).
   * @param {String} accountId id of the MetaTrader account to synchronize
   * @param {Number} instanceIndex instance index
   * @param {String} host name of host to synchronize with
   * @param {String} synchronizationId synchronization request id
   * @param {Date} startingHistoryOrderTime from what date to start synchronizing history orders from. If not specified,
   * the entire order history will be downloaded.
   * @param {Date} startingDealTime from what date to start deal synchronization from. If not specified, then all
   * history deals will be downloaded.
   * @param {Function} getHashes function to get terminal state hashes
   * @returns {Promise} promise which resolves when synchronization started
   */
  async synchronize(accountId, instanceIndex, host, synchronizationId, startingHistoryOrderTime, startingDealTime,  
    getHashes) {
    if(this._getSocketInstanceByAccount(accountId, instanceIndex) === undefined) {
      this._logger.debug(`${accountId}:${instanceIndex}: creating socket instance on synchronize`);
      await this._createSocketInstanceByAccount(accountId, instanceIndex);
    }
    const syncThrottler = this._getSocketInstanceByAccount(accountId, instanceIndex)
      .synchronizationThrottler;
    return syncThrottler.scheduleSynchronize(accountId, {requestId: synchronizationId, 
      type: 'synchronize', startingHistoryOrderTime, startingDealTime, instanceIndex, host}, getHashes);
  }

  /**
   * Waits for server-side terminal state synchronization to complete.
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/waitSynchronized/).
   * @param {String} accountId id of the MetaTrader account to synchronize
   * @param {Number} [instanceNumber] instance index number
   * @param {String} applicationPattern MetaApi application regular expression pattern, default is .*
   * @param {Number} timeoutInSeconds timeout in seconds, default is 300 seconds
   * @param {String} [application] application to synchronize with
   * @returns {Promise} promise which resolves when synchronization started
   */
  waitSynchronized(accountId, instanceNumber, applicationPattern, timeoutInSeconds, application) {
    return this.rpcRequest(accountId, {type: 'waitSynchronized', applicationPattern, timeoutInSeconds,
      instanceIndex: instanceNumber, application: application || this._application},
    timeoutInSeconds + 1);
  }

  /**
   * Market data subscription
   * @typedef {Object} MarketDataSubscription
   * @property {string} type subscription type, one of quotes, candles, ticks, or marketDepth
   * @property {string} [timeframe] when subscription type is candles, defines the timeframe according to which the
   * candles must be generated. Allowed values for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h,
   * 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @property {number} [intervalInMilliseconds] defines how frequently the terminal will stream data to client. If not
   * set, then the value configured in account will be used
   */

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} accountId id of the MetaTrader account
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update
   * @param {String} [reliability] account reliability
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  subscribeToMarketData(accountId, symbol, subscriptions, reliability) {
    return this.rpcRequestAllInstances(accountId,
      {type: 'subscribeToMarketData', symbol, subscriptions}, reliability);
  }

  /**
   * Refreshes market data subscriptions on the server to prevent them from expiring
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   * @param {Array} subscriptions array of subscriptions to refresh
   */
  refreshMarketDataSubscriptions(accountId, instanceNumber, subscriptions) {
    return this.rpcRequest(accountId, {type: 'refreshMarketDataSubscriptions', subscriptions,
      instanceIndex: instanceNumber});
  }

  /**
   * Market data unsubscription
   * @typedef {Object} MarketDataUnsubscription
   * @property {string} type subscription type, one of quotes, candles, ticks, or marketDepth
   */

  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {String} accountId id of the MetaTrader account
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @param {String} [reliability] account reliability
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(accountId, symbol, subscriptions, reliability) {
    return this.rpcRequestAllInstances(accountId, {type: 'unsubscribeFromMarketData', symbol, subscriptions},
      reliability);
  }

  /**
   * Retrieves symbols available on an account (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbols/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbols for
   * @returns {Promise<Array<string>>} promise which resolves when symbols are retrieved
   */
  async getSymbols(accountId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getSymbols'});
    return response.symbols;
  }

  /**
   * Retrieves specification for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolSpecification/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol specification for
   * @param {String} symbol symbol to retrieve specification for
   * @returns {Promise<MetatraderSymbolSpecification>} promise which resolves when specification is retrieved
   */
  async getSymbolSpecification(accountId, symbol) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getSymbolSpecification', symbol});
    return response.specification;
  }

  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readSymbolPrice/).
   * @param {String} accountId id of the MetaTrader account to retrieve symbol price for
   * @param {String} symbol symbol to retrieve price for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderSymbolPrice>} promise which resolves when price is retrieved
   */
  async getSymbolPrice(accountId, symbol, keepSubscription = false) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getSymbolPrice', symbol,
      keepSubscription});
    return response.price;
  }

  /**
   * Retrieves price for a symbol (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readCandle/).
   * @param {string} accountId id of the MetaTrader account to retrieve candle for
   * @param {string} symbol symbol to retrieve candle for
   * @param {string} timeframe defines the timeframe according to which the candle must be generated. Allowed values for
   * MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed values
   * for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderCandle>} promise which resolves when candle is retrieved
   */
  async getCandle(accountId, symbol, timeframe, keepSubscription = false) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getCandle', symbol, timeframe,
      keepSubscription});
    return response.candle;
  }

  /**
   * Retrieves latest tick for a symbol. MT4 G1 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readTick/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol tick for
   * @param {string} symbol symbol to retrieve tick for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderTick>} promise which resolves when tick is retrieved
   */
  async getTick(accountId, symbol, keepSubscription = false) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getTick', symbol, keepSubscription});
    return response.tick;
  }

  /**
   * Retrieves latest order book for a symbol. MT4 accounts do not support this API (see
   * https://metaapi.cloud/docs/client/websocket/api/retrieveMarketData/readBook/).
   * @param {string} accountId id of the MetaTrader account to retrieve symbol order book for
   * @param {string} symbol symbol to retrieve order book for
   * @param {boolean} keepSubscription if set to true, the account will get a long-term subscription to symbol market
   * data. Long-term subscription means that on subsequent calls you will get updated value faster. If set to false or
   * not set, the subscription will be set to expire in 12 minutes.
   * @returns {Promise<MetatraderBook>} promise which resolves when order book is retrieved
   */
  async getBook(accountId, symbol, keepSubscription = false) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getBook', symbol, keepSubscription});
    return response.book;
  }

  /**
   * Sends client uptime stats to the server.
   * @param {String} accountId id of the MetaTrader account to save uptime
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(accountId, uptime) {
    return this.rpcRequest(accountId, {type: 'saveUptime', uptime});
  }

  /**
   * Unsubscribe from account (see
   * https://metaapi.cloud/docs/client/websocket/api/synchronizing/unsubscribe).
   * @param {String} accountId id of the MetaTrader account to unsubscribe
   * @returns {Promise} promise which resolves when socket unsubscribed
   */
  async unsubscribe(accountId) {
    try {
      const region = this.getAccountRegion(accountId);
      this._latencyService.onUnsubscribe(accountId);
      await Promise.all(Object.keys(this._socketInstances[region]).map(async instanceNumber => {
        await this._subscriptionManager.unsubscribe(accountId, Number(instanceNumber));
        delete this._socketInstancesByAccounts[instanceNumber][accountId];
      }));
    } catch (err) {
      if (!(['TimeoutError', 'NotFoundError'].includes(err.name))) {
        throw err;
      }
    }
  }

  /**
   * Current server time (see https://metaapi.cloud/docs/client/models/serverTime/)
   * @typedef {Object} ServerTime
   * @property {Date} time current server time
   * @property {String} brokerTime current broker time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Date} [lastQuoteTime] last quote time
   * @property {String} [lastQuoteBrokerTime] last quote time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */

  /**
   * Returns server time for a specified MetaTrader account (see
   * https://metaapi.cloud/docs/client/websocket/api/readTradingTerminalState/readServerTime/).
   * @param {string} accountId id of the MetaTrader account to return server time for
   * @returns {Promise<ServerTime>} promise resolving with server time
   */
  async getServerTime(accountId) {
    let response = await this.rpcRequest(accountId, {application: 'RPC', type: 'getServerTime'});
    return response.serverTime;
  }

  /**
   * Margin required to open a trade (see https://metaapi.cloud/docs/client/models/margin/)
   * @typedef {Object} Margin
   * @property {number} [margin] margin required to open a trade. If margin can not be calculated, then this field is
   * not defined
   */

  /**
   * Contains order to calculate margin for (see https://metaapi.cloud/docs/client/models/marginOrder/)
   * @typedef {Object} MarginOrder
   * @property {string} symbol order symbol
   * @property {string} type order type, one of ORDER_TYPE_BUY or ORDER_TYPE_SELL
   * @property {number} volume order volume, must be greater than 0
   * @property {number} openPrice order open price, must be greater than 0
   */

  /**
   * Calculates margin required to open a trade on the specified trading account (see
   * https://metaapi.cloud/docs/client/websocket/api/calculateMargin/).
   * @param {string} accountId id of the trading account to calculate margin for
   * @param {string} application application to send the request to
   * @param {string} reliability account reliability
   * @param {MarginOrder} order order to calculate margin for
   * @returns {Promise<Margin>} promise resolving with margin calculation result
   */
  async calculateMargin(accountId, application, reliability, order) {
    let response;
    if(application === 'RPC') {
      response = await this.rpcRequest(accountId, {application, type: 'calculateMargin', order});
    } else {
      response = await this.rpcRequestAllInstances(accountId, {application, type: 'calculateMargin', order},
        reliability);
    }
    return response.margin;
  }

  /**
   * Calls onUnsubscribeRegion listener event 
   * @param {String} accountId account id
   * @param {String} region account region to unsubscribe
   */
  async unsubscribeAccountRegion(accountId, region) {
    const unsubscribePromises = [];
    for (let listener of this._synchronizationListeners[accountId] || []) {
      unsubscribePromises.push(
        Promise.resolve((async () => {
          await this._processEvent(
            () => listener.onUnsubscribeRegion(region),
            `${accountId}:${region}:onUnsubscribeRegion`, true);
        })())
          .catch(err => this._logger.error(`${accountId}:${region}: Failed to notify listener ` +
               'about onUnsubscribeRegion event', err))
      );
    }
    await Promise.all(unsubscribePromises);
  }

  /**
   * Adds synchronization listener for specific account
   * @param {String} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(accountId, listener) {
    this._logger.trace(`${accountId}: Added synchronization listener`);
    let listeners = this._synchronizationListeners[accountId];
    if (!listeners) {
      listeners = [];
      this._synchronizationListeners[accountId] = listeners;
    }
    listeners.push(listener);
  }

  /**
   * Removes synchronization listener for specific account
   * @param {String} accountId account id
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(accountId, listener) {
    this._logger.trace(`${accountId}: Removed synchronization listener`);
    let listeners = this._synchronizationListeners[accountId];
    if (!listeners) {
      listeners = [];
    }
    listeners = listeners.filter(l => l !== listener);
    this._synchronizationListeners[accountId] = listeners;
  }

  /**
   * Adds latency listener
   * @param {LatencyListener} listener latency listener to add
   */
  addLatencyListener(listener) {
    this._latencyListeners.push(listener);
  }

  /**
   * Removes latency listener
   * @param {LatencyListener} listener latency listener to remove
   */
  removeLatencyListener(listener) {
    this._latencyListeners = this._latencyListeners.filter(l => l !== listener);
  }

  /**
   * Adds reconnect listener
   * @param {ReconnectListener} listener reconnect listener to add
   * @param {String} accountId account id of listener
   */
  addReconnectListener(listener, accountId) {
    this._reconnectListeners.push({accountId, listener});
  }

  /**
   * Removes reconnect listener
   * @param {ReconnectListener} listener listener to remove
   */
  removeReconnectListener(listener) {
    this._reconnectListeners = this._reconnectListeners.filter(l => l.listener !== listener);
  }

  /**
   * Removes all listeners. Intended for use in unit tests.
   */
  removeAllListeners() {
    this._synchronizationListeners = {};
    this._reconnectListeners = [];
  }
  
  /**
   * Queues an account packet for processing
   * @param {Object} packet packet to process
   */
  queuePacket(packet) {
    const accountId = packet.accountId;
    const packets = this._packetOrderer.restoreOrder(packet).filter(p => p.type !== 'noop');
    if(this._sequentialEventProcessing && packet.sequenceNumber !== undefined) {
      const events = packets.map(packetItem => () => 
        Promise.resolve(this._processSynchronizationPacket(packetItem)));
      if (!this._eventQueues[accountId]) {
        this._eventQueues[accountId] = events;
        this._callAccountEvents(accountId);
      } else {
        this._eventQueues[accountId] = this._eventQueues[accountId].concat(events);
      }
    } else {
      packets.forEach(packetItem => this._processSynchronizationPacket(packetItem));
    }
  }

  /**
   * Queues account event for processing
   * @param {String} accountId account id
   * @param {String} name event label name
   * @param {Function} callable async or regular function to execute
   */
  queueEvent(accountId, name, callable) {
    let event = () => this._processEvent(callable, `${accountId}:${name}`);
    if(this._sequentialEventProcessing) {
      if (!this._eventQueues[accountId]) { 
        this._eventQueues[accountId] = [event];
        this._callAccountEvents(accountId);
      } else {
        this._eventQueues[accountId].push(event);
      }
    } else {
      event();
    }
  }

  async _callAccountEvents(accountId) {
    if(this._eventQueues[accountId]) {
      while(this._eventQueues[accountId].length) {
        await this._eventQueues[accountId][0]();
        this._eventQueues[accountId].shift();
      }
      delete this._eventQueues[accountId];
    }
  }

  async _reconnect(instanceNumber, socketInstanceIndex, region) {
    const instance = this.socketInstances[region][instanceNumber][socketInstanceIndex];
    if (instance) {
      while (!instance.socket.connected && !instance.isReconnecting && instance.connected) {
        await this._tryReconnect(instanceNumber, socketInstanceIndex, region);
      }
    }
  }

  _tryReconnect(instanceNumber, socketInstanceIndex, region) {
    const instance = this.socketInstances[region][instanceNumber][socketInstanceIndex];
    instance.reconnectWaitTime = Math.min(instance.reconnectWaitTime * 2, 30000);
    return new Promise((resolve) => setTimeout(async () => {
      if (!instance.socket.connected && !instance.isReconnecting && instance.connected) {
        try {
          instance.sessionId = randomstring.generate(32);
          const clientId = Math.random();
          instance.socket.close();
          instance.socket.io.opts.extraHeaders['Client-Id'] = clientId;
          instance.socket.io.opts.query.clientId = clientId;
          instance.isReconnecting = true;
          instance.socket.io.uri = await this._getServerUrl(instanceNumber, socketInstanceIndex, region);
          instance.socket.connect();
        } catch (error) {
          instance.isReconnecting = false;
        }
      }
      resolve();
    }, instance.reconnectWaitTime));
  }

  /**
   * Simulataneously sends RPC requests to all synchronized instances
   * @param {String} accountId metatrader account id
   * @param {Object} request base request data
   * @param {String} [reliability] account reliability
   * @param {Number} [timeoutInSeconds] request timeout in seconds
   */
  async rpcRequestAllInstances(accountId, request, reliability, timeoutInSeconds)  {
    if(reliability === 'high') {
      try {
        return await any([0, 1].map(instanceNumber => {
          return this.rpcRequest(accountId, Object.assign({}, request, 
            {instanceIndex: instanceNumber}), timeoutInSeconds);
        }));
      } catch (error) {
        throw error.errors[0]; 
      }
    } else {
      return await this.rpcRequest(accountId, request, timeoutInSeconds);
    }
  }

  /**
   * Makes a RPC request
   * @param {String} accountId metatrader account id
   * @param {Object} request base request data
   * @param {Number} [timeoutInSeconds] request timeout in seconds
   */
  //eslint-disable-next-line complexity, max-statements
  async rpcRequest(accountId, request, timeoutInSeconds) {
    const ignoredRequestTypes = ['subscribe', 'synchronize', 'refreshMarketDataSubscriptions', 'unsubscribe'];
    const primaryAccountId = this._accountsByReplicaId[accountId];
    const connectedInstance = this._latencyService.getActiveAccountInstances(primaryAccountId)[0];
    if(!ignoredRequestTypes.includes(request.type) && connectedInstance) {
      const activeRegion = connectedInstance.split(':')[1];
      accountId = this._accountReplicas[primaryAccountId][activeRegion];
    }
    let socketInstanceIndex = null;
    let instanceNumber = 0;
    const region = this.getAccountRegion(accountId);
    this._refreshAccountRegion(accountId);
    if(request.instanceIndex !== undefined) {
      instanceNumber = request.instanceIndex;
    } else {
      if(connectedInstance) {
        instanceNumber = Number(connectedInstance.split(':')[2]);
      }
      if(request.application !== 'RPC') {
        request = Object.assign({}, request, {instanceIndex: instanceNumber});
      }
    }
    if(!this._socketInstancesByAccounts[instanceNumber]) {
      this._socketInstancesByAccounts[instanceNumber] = {};
    }
    if(!this._socketInstances[region]) {
      this._socketInstances[region] = {};
    }
    if(!this._socketInstances[region][instanceNumber]) {
      this._socketInstances[region][instanceNumber] = [];
    }
    if (this._socketInstancesByAccounts[instanceNumber][accountId] !== undefined) {
      socketInstanceIndex = this._socketInstancesByAccounts[instanceNumber][accountId];
    } else {
      this._logger.debug(`${accountId}:${instanceNumber}: creating socket instance on RPC request`);
      await this._createSocketInstanceByAccount(accountId, instanceNumber);
      socketInstanceIndex = this._socketInstancesByAccounts[instanceNumber][accountId];
    }
    const instance = this._socketInstances[region][instanceNumber][socketInstanceIndex];
    if (!instance.connected) {
      this._logger.debug(`${accountId}:${instanceNumber}: connecting socket instance on RPC request`);
      await this.connect(instanceNumber, region);
    } else if(!this.connected(instanceNumber, socketInstanceIndex, region)) {
      await instance.connectResult;
    }
    if(request.type === 'subscribe') {
      request.sessionId = instance.sessionId;
    }
    if(['trade', 'subscribe'].includes(request.type)) {
      return this._makeRequest(accountId, instanceNumber, request, timeoutInSeconds);
    }
    let retryCounter = 0;
    while (true) { //eslint-disable-line no-constant-condition
      try {
        return await this._makeRequest(accountId, instanceNumber, request, timeoutInSeconds);
      } catch(err) {
        if(err.name === 'TooManyRequestsError') {
          let calcRetryCounter = retryCounter;
          let calcRequestTime = 0;
          while(calcRetryCounter < this._retries) {
            calcRetryCounter++;
            calcRequestTime += Math.min(Math.pow(2, calcRetryCounter) * this._minRetryDelayInSeconds,
              this._maxRetryDelayInSeconds) * 1000;
          }
          const retryTime = new Date(err.metadata.recommendedRetryTime).getTime();
          if (Date.now() + calcRequestTime > retryTime && retryCounter < this._retries) {
            if(Date.now() < retryTime) {
              await new Promise(res => setTimeout(res, retryTime - Date.now()));
            }
            retryCounter++;
          } else {
            throw err;
          }
        } else if(['NotSynchronizedError', 'TimeoutError', 'NotAuthenticatedError',
          'InternalError'].includes(err.name) && 
          retryCounter < this._retries) {
          await new Promise(res => setTimeout(res, Math.min(Math.pow(2, retryCounter) * 
            this._minRetryDelayInSeconds, this._maxRetryDelayInSeconds) * 1000));
          retryCounter++;
        } else {
          throw err;
        }
        if(this._socketInstancesByAccounts[instanceNumber][accountId] === undefined) {
          throw err;
        }
      }
    }
  }

  _makeRequest(accountId, instanceNumber, request, timeoutInSeconds) {
    const socketInstance = this._getSocketInstanceByAccount(accountId, instanceNumber);
    let requestId = request.requestId || randomstring.generate(32);
    request.timestamps = {clientProcessingStarted: new Date()};
    let result = Promise.race([
      new Promise((resolve, reject) => socketInstance.requestResolves[requestId] = 
        {resolve, reject, type: request.type}),
      new Promise((resolve, reject) => setTimeout(() => {
        reject(new TimeoutError(`MetaApi websocket client request ${request.requestId} of type ${request.type} ` +
          'timed out. Please make sure your account is connected to broker before retrying your request.'));
        delete socketInstance.requestResolves[requestId];
      }, (timeoutInSeconds * 1000) || this._requestTimeout))
    ]);
    request.accountId = accountId;
    request.application = request.application || this._application;
    if (!request.requestId) {
      request.requestId = requestId;
    }
    if (request.type === 'unsubscribe' || request.application === 'RPC' ||
      request.instanceIndex === socketInstance.instanceNumber) {
      this._logger.debug(() => `${accountId}: Sending request: ${JSON.stringify(request)}`);
      socketInstance.socket.emit('request', request);
      return result;
    } else {
      this._logger.trace(() => `${accountId}:${request.instanceIndex}: skipping request because it is being sent to ` +
        `the socket of the wrong instance index, request=${JSON.stringify(request)}`);
      return result;
    }
  }

  // eslint-disable-next-line complexity
  _convertError(data) {
    if (data.error === 'ValidationError') {
      return new ValidationError(data.message, data.details);
    } else if (data.error === 'NotFoundError') {
      return new NotFoundError(data.message);
    } else if (data.error === 'NotSynchronizedError') {
      return new NotSynchronizedError(data.message);
    } else if (data.error === 'TimeoutError') {
      return new TimeoutError(data.message);
    } else if (data.error === 'NotAuthenticatedError') {
      return new NotConnectedError(data.message);
    } else if (data.error === 'TradeError') {
      return new TradeError(data.message, data.numericCode, data.stringCode);
    } else if (data.error === 'UnauthorizedError') {
      this.close();
      return new UnauthorizedError(data.message);
    } else if (data.error === 'TooManyRequestsError') {
      return new TooManyRequestsError(data.message, data.metadata);
    } else {
      return new InternalError(data.message);
    }
  }

  // eslint-disable-next-line complexity
  _convertIsoTimeToDate(packet) {
    // eslint-disable-next-line guard-for-in
    for (let field in packet) {
      let value = packet[field];
      if (typeof value === 'string' && field.match(/time$|Time$/) && 
        !field.match(/brokerTime$|BrokerTime$|timeframe$/)) {
        packet[field] = new Date(value);
      }
      if (Array.isArray(value)) {
        for (let item of value) {
          this._convertIsoTimeToDate(item);
        }
      }
      if (typeof value === 'object') {
        this._convertIsoTimeToDate(value);
      }
    }
    if (packet && packet.timestamps) {
      // eslint-disable-next-line guard-for-in
      for (let field in packet.timestamps) {
        packet.timestamps[field] = new Date(packet.timestamps[field]);
      }
    }
    if (packet && packet.type === 'prices') {
      for (let price of packet.prices || []) {
        if (price.timestamps) {
          // eslint-disable-next-line guard-for-in
          for (let field in price.timestamps) {
            price.timestamps[field] = new Date(price.timestamps[field]);
          }
        }
      }
    }
  }

  /**
   * MetaTrader symbol specification. Contains symbol specification (see
   * https://metaapi.cloud/docs/client/models/metatraderSymbolSpecification/)
   * @typedef {Object} MetatraderSymbolSpecification
   * @property {String} symbol symbol (e.g. a currency pair or an index)
   * @property {Number} tickSize tick size
   * @property {Number} minVolume minimum order volume for the symbol
   * @property {Number} maxVolume maximum order volume for the symbol
   * @property {Number} volumeStep order volume step for the symbol
   * @property {Array<String>} list of allowed order filling modes. Can contain ORDER_FILLING_FOK, ORDER_FILLING_IOC or
   * both. See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_filling_mode for more
   * details.
   * @property {String} deal execution mode. Possible values are SYMBOL_TRADE_EXECUTION_REQUEST,
   * SYMBOL_TRADE_EXECUTION_INSTANT, SYMBOL_TRADE_EXECUTION_MARKET, SYMBOL_TRADE_EXECUTION_EXCHANGE. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_execution for more
   * details.
   * @property {Number} contractSize trade contract size
   * @property {MetatraderSessions} quoteSessions quote sessions, indexed by day of week
   * @property {MetatraderSessions} tradeSessions trade sessions, indexed by day of week
   * @property {String} [tradeMode] order execution type. Possible values are SYMBOL_TRADE_MODE_DISABLED,
   * SYMBOL_TRADE_MODE_LONGONLY, SYMBOL_TRADE_MODE_SHORTONLY, SYMBOL_TRADE_MODE_CLOSEONLY, SYMBOL_TRADE_MODE_FULL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_trade_mode for more
   * details
   * @property {Number} [bondAccruedInterest] accrued interest – accumulated coupon interest, i.e. part of the coupon
   * interest calculated in proportion to the number of days since the coupon bond issuance or the last coupon interest
   * payment
   * @property {Number} [bondFaceValue] face value – initial bond value set by the issuer
   * @property {Number} [optionStrike] the strike price of an option. The price at which an option buyer can buy (in a
   * Call option) or sell (in a Put option) the underlying asset, and the option seller is obliged to sell or buy the
   * appropriate amount of the underlying asset.
   * @property {Number} [optionPriceSensivity] option/warrant sensitivity shows by how many points the price of the
   * option's underlying asset should change so that the price of the option changes by one point
   * @property {Number} [liquidityRate] liquidity Rate is the share of the asset that can be used for the margin
   * @property {Number} initialMargin initial margin means the amount in the margin currency required for opening a
   * position with the volume of one lot. It is used for checking a client's assets when he or she enters the market
   * @property {Number} maintenanceMargin the maintenance margin. If it is set, it sets the margin amount in the margin
   * currency of the symbol, charged from one lot. It is used for checking a client's assets when his/her account state
   * changes. If the maintenance margin is equal to 0, the initial margin is used
   * @property {Number} hedgedMargin contract size or margin value per one lot of hedged positions (oppositely directed
   * positions of one symbol). Two margin calculation methods are possible for hedged positions. The calculation method
   * is defined by the broker
   * @property {Boolean} [hedgedMarginUsesLargerLeg] calculating hedging margin using the larger leg (Buy or Sell)
   * @property {String} marginCurrency margin currency
   * @property {String} priceCalculationMode contract price calculation mode. One of SYMBOL_CALC_MODE_UNKNOWN,
   * SYMBOL_CALC_MODE_FOREX, SYMBOL_CALC_MODE_FOREX_NO_LEVERAGE, SYMBOL_CALC_MODE_FUTURES, SYMBOL_CALC_MODE_CFD,
   * SYMBOL_CALC_MODE_CFDINDEX, SYMBOL_CALC_MODE_CFDLEVERAGE, SYMBOL_CALC_MODE_EXCH_STOCKS,
   * SYMBOL_CALC_MODE_EXCH_FUTURES, SYMBOL_CALC_MODE_EXCH_FUTURES_FORTS, SYMBOL_CALC_MODE_EXCH_BONDS,
   * SYMBOL_CALC_MODE_EXCH_STOCKS_MOEX, SYMBOL_CALC_MODE_EXCH_BONDS_MOEX, SYMBOL_CALC_MODE_SERV_COLLATERAL. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_calc_mode for more details
   * @property {String} baseCurrency base currency
   * @property {String} [profitCurrency] profit currency
   * @property {String} swapMode swap calculation model. Allowed values are SYMBOL_SWAP_MODE_DISABLED,
   * SYMBOL_SWAP_MODE_POINTS, SYMBOL_SWAP_MODE_CURRENCY_SYMBOL, SYMBOL_SWAP_MODE_CURRENCY_MARGIN,
   * SYMBOL_SWAP_MODE_CURRENCY_DEPOSIT, SYMBOL_SWAP_MODE_INTEREST_CURRENT, SYMBOL_SWAP_MODE_INTEREST_OPEN,
   * SYMBOL_SWAP_MODE_REOPEN_CURRENT, SYMBOL_SWAP_MODE_REOPEN_BID. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_swap_mode for more details
   * @property {Number} [swapLong] long swap value
   * @property {Number} [swapShort] short swap value
   * @property {String} [swapRollover3Days] day of week to charge 3 days swap rollover. Allowed values are SUNDAY,
   * MONDAY, TUESDAY, WEDNESDAY, THURDAY, FRIDAY, SATURDAY, NONE
   * @property {Array<String>} allowedExpirationModes allowed order expiration modes. Allowed values are
   * SYMBOL_EXPIRATION_GTC, SYMBOL_EXPIRATION_DAY, SYMBOL_EXPIRATION_SPECIFIED, SYMBOL_EXPIRATION_SPECIFIED_DAY.
   * See https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_expiration_mode for more
   * details
   * @property {Array<String>} allowedOrderTypes allowed order types. Allowed values are SYMBOL_ORDER_MARKET,
   * SYMBOL_ORDER_LIMIT, SYMBOL_ORDER_STOP, SYMBOL_ORDER_STOP_LIMIT, SYMBOL_ORDER_SL, SYMBOL_ORDER_TP,
   * SYMBOL_ORDER_CLOSEBY. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#symbol_order_mode for more details
   * @property {String} orderGTCMode if the expirationMode property is set to SYMBOL_EXPIRATION_GTC (good till
   * canceled), the expiration of pending orders, as well as of Stop Loss/Take Profit orders should be additionally set
   * using this enumeration. Allowed values are SYMBOL_ORDERS_GTC, SYMBOL_ORDERS_DAILY,
   * SYMBOL_ORDERS_DAILY_EXCLUDING_STOPS. See
   * https://www.mql5.com/en/docs/constants/environment_state/marketinfoconstants#enum_symbol_order_gtc_mode for more
   * details
   * @property {Number} digits digits after a decimal point
   * @property {Number} point point size
   * @property {String} [path] path in the symbol tree
   * @property {String} description symbol description
   * @property {Date} [startTime] date of the symbol trade beginning (usually used for futures)
   * @property {Date} [expirationTime] date of the symbol trade end (usually used for futures)
   * @property {number} [pipSize] size of a pip. Pip size is defined for spot and CFD symbols only
   * @property {number} stopsLevel minimal indention in points from the current close price to place Stop orders
   * @property {number} freezeLevel distance to freeze trade operations in points
   */

  /**
   * Metatrader trade or quote session container, indexed by weekday
   * @typedef {Object} MetatraderSessions
   * @property {Array<MetatraderSession>} [SUNDAY] array of sessions for SUNDAY
   * @property {Array<MetatraderSession>} [MONDAY] array of sessions for MONDAY
   * @property {Array<MetatraderSession>} [TUESDAY] array of sessions for TUESDAY
   * @property {Array<MetatraderSession>} [WEDNESDAY] array of sessions for WEDNESDAY
   * @property {Array<MetatraderSession>} [THURSDAY] array of sessions for THURSDAY
   * @property {Array<MetatraderSession>} [FRIDAY] array of sessions for FRIDAY
   * @property {Array<MetatraderSession>} [SATURDAY] array of sessions for SATURDAY
   */

  /**
   * Metatrader trade or quote session
   * @typedef {Object} MetatraderSession
   * @property {String} from session start time, in hh.mm.ss.SSS format
   * @property {String} to session end time, in hh.mm.ss.SSS format
   */

  /**
   * MetaTrader symbol price. Contains current price for a symbol (see
   * https://metaapi.cloud/docs/client/models/metatraderSymbolPrice/)
   * @typedef {Object} MetatraderSymbolPrice
   * @property {String} symbol symbol (e.g. a currency pair or an index)
   * @property {Number} bid bid price
   * @property {Number} ask ask price
   * @property {Number} profitTickValue tick value for a profitable position
   * @property {Number} lossTickValue tick value for a losing position
   * @property {Number} [accountCurrencyExchangeRate] current exchange rate of account currency into account base
   * currency (USD if you did not override it)
   * @property {Date} time quote time, in ISO format
   * @property {String} brokerTime time quote time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */

  /**
   * MetaTrader candle
   * @typedef {Object} MetatraderCandle
   * @property {string} symbol symbol (e.g. currency pair or an index)
   * @property {string} timeframe timeframe candle was generated for, e.g. 1h. One of 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m,
   * 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn
   * @property {Date} time candle opening time
   * @property {string} brokerTime candle opening time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {number} open open price
   * @property {number} high high price
   * @property {number} low low price
   * @property {number} close close price
   * @property {number} tickVolume tick volume, i.e. number of ticks inside the candle
   * @property {number} spread spread in points
   * @property {number} volume trade volume
   */

  /**
   * MetaTrader tick data
   * @typedef {Object} MetatraderTick
   * @property {string} symbol symbol (e.g. a currency pair or an index)
   * @property {Date} time time
   * @property {string} brokerTime time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {number} [bid] bid price
   * @property {number} [ask] ask price
   * @property {number} [last] last deal price
   * @property {number} [volume] volume for the current last deal price
   * @property {string} side is tick a result of buy or sell deal, one of buy or sell
   */

  /**
   * MetaTrader order book
   * @typedef {Object} MetatraderBook
   * @property {string} symbol symbol (e.g. a currency pair or an index)
   * @property {Date} time time
   * @property {string} brokerTime time, in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   * @property {Array<MetatraderBookEntry>} book list of order book entries
   */

  /**
   * MetaTrader order book entry
   * @typedef {Object} MetatraderBookEntry
   * @property {string} type entry type, one of BOOK_TYPE_SELL, BOOK_TYPE_BUY, BOOK_TYPE_SELL_MARKET,
   * BOOK_TYPE_BUY_MARKET
   * @property {number} price price
   * @property {number} volume volume
   */

  // eslint-disable-next-line complexity,max-statements
  async _processSynchronizationPacket(data) {
    try {
      const instanceNumber = data.instanceIndex || 0;
      const socketInstance = this._getSocketInstanceByAccount(data.accountId, instanceNumber);
      if (data.synchronizationId && socketInstance) {
        socketInstance.synchronizationThrottler.updateSynchronizationId(data.synchronizationId);
      }
      const region = this.getAccountRegion(data.accountId);
      const primaryAccountId = this._accountsByReplicaId[data.accountId];
      let instanceId = this._accountsByReplicaId[data.accountId] + ':' + 
        region + ':' + instanceNumber + ':' + (data.host || 0);
      let instanceIndex = region + ':' + instanceNumber + ':' + (data.host || 0);

      const isOnlyActiveInstance = () => {
        const activeInstanceIds = Object.keys(this._connectedHosts).filter(instance => 
          instance.startsWith(primaryAccountId + ':' + region + ':' + instanceNumber));
        return !activeInstanceIds.length || activeInstanceIds.length === 1 && activeInstanceIds[0] === instanceId;
      };

      const cancelDisconnectTimer = () => {
        if (this._statusTimers[instanceId]) {
          clearTimeout(this._statusTimers[instanceId]);
        }
      };

      const resetDisconnectTimer = () => {
        cancelDisconnectTimer();
        this._statusTimers[instanceId] = setTimeout(() => {
          if(isOnlyActiveInstance()) {
            this._subscriptionManager.onTimeout(data.accountId, 0);
            this._subscriptionManager.onTimeout(data.accountId, 1);
          }
          this.queueEvent(primaryAccountId, `${instanceIndex}:onDisconnected`, () => onDisconnected(true));
          clearTimeout(this._statusTimers[instanceId]);
        }, 60000);
      };

      // eslint-disable-next-line complexity
      const onDisconnected = async (isTimeout = false) => { 
        if (this._connectedHosts[instanceId]) {
          this._latencyService.onDisconnected(instanceId);
          if(isOnlyActiveInstance()) {
            const onDisconnectedPromises = [];
            if(!isTimeout) {
              onDisconnectedPromises.push(this._subscriptionManager.onDisconnected(data.accountId, 0));
              onDisconnectedPromises.push(this._subscriptionManager.onDisconnected(data.accountId, 1));
            }
            for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
              onDisconnectedPromises.push(this._processEvent(
                () => listener.onDisconnected(instanceIndex),
                `${primaryAccountId}:${instanceIndex}:onDisconnected`));
            }
            await Promise.all(onDisconnectedPromises);
          }
          const onStreamClosedPromises = [];
          this._packetOrderer.onStreamClosed(instanceId);
          if(socketInstance) {
            socketInstance.synchronizationThrottler.removeIdByParameters(data.accountId, instanceNumber, data.host);
          }
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onStreamClosedPromises.push(this._processEvent(
              () => listener.onStreamClosed(instanceIndex),
              `${primaryAccountId}:${instanceIndex}:onStreamClosed`));
          }
          await Promise.all(onStreamClosedPromises);
          delete this._connectedHosts[instanceId];
        }
      };
      if (data.type === 'authenticated') {
        resetDisconnectTimer();
        if((!data.sessionId) || socketInstance && (data.sessionId === socketInstance.sessionId)) {
          this._latencyService.onConnected(instanceId);
          this._connectedHosts[instanceId] = data.host;
          const onConnectedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onConnectedPromises.push(this._processEvent(
              () => listener.onConnected(instanceIndex, data.replicas),
              `${primaryAccountId}:${instanceIndex}:onConnected`));
          }
          this._subscriptionManager.cancelSubscribe(data.accountId + ':' + instanceNumber);
          if(data.replicas === 1) {
            this._subscriptionManager.cancelAccount(data.accountId);
          } else {
            this._subscriptionManager.cancelSubscribe(data.accountId + ':' + instanceNumber);
          }
          await Promise.all(onConnectedPromises);
        }
      } else if (data.type === 'disconnected') {
        cancelDisconnectTimer();
        await onDisconnected();
      } else if (data.type === 'synchronizationStarted') {
        const promises = [];
        this._synchronizationFlags[data.synchronizationId] = {
          accountId: data.accountId,
          instanceNumber,
          positionsUpdated: data.positionsUpdated !== undefined ? data.positionsUpdated : true,
          ordersUpdated: data.ordersUpdated !== undefined ? data.ordersUpdated : true
        };
        this._synchronizationIdByInstance[instanceId] = data.synchronizationId;
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          promises.push(this._processEvent(
            () => listener.onSynchronizationStarted(instanceIndex,
              data.specificationsUpdated !== undefined ? data.specificationsUpdated : true,
              data.positionsUpdated !== undefined ? data.positionsUpdated : true,
              data.ordersUpdated !== undefined ? data.ordersUpdated : true, data.synchronizationId),
            `${primaryAccountId}:${instanceIndex}:onSynchronizationStarted`));
        }
        await Promise.all(promises);
      } else if (data.type === 'accountInformation') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        if (data.accountInformation) {
          const onAccountInformationUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onAccountInformationUpdatedPromises.push(
              Promise.resolve((async () => {
                await this._processEvent(
                  () => listener.onAccountInformationUpdated(instanceIndex, data.accountInformation),
                  `${primaryAccountId}:${instanceIndex}:onAccountInformationUpdated`, true);
                if(this._synchronizationFlags[data.synchronizationId] && 
                    !this._synchronizationFlags[data.synchronizationId].positionsUpdated) {
                  await this._processEvent(
                    () => listener.onPositionsSynchronized(instanceIndex, data.synchronizationId),
                    `${primaryAccountId}:${instanceIndex}:onPositionsSynchronized`, true);
                  if(!this._synchronizationFlags[data.synchronizationId].ordersUpdated) {
                    await this._processEvent(
                      () => listener.onPendingOrdersSynchronized(instanceIndex, data.synchronizationId),
                      `${primaryAccountId}:${instanceIndex}:onPendingOrdersSynchronized`, true);
                  }
                }
              })())
                .catch(err => this._logger.error(`${primaryAccountId}:${instanceIndex}: Failed to notify listener ` +
                  'about accountInformation event', err))
            );
          }
          await Promise.all(onAccountInformationUpdatedPromises);
          if(this._synchronizationFlags[data.synchronizationId] && 
              !this._synchronizationFlags[data.synchronizationId].positionsUpdated && 
              !this._synchronizationFlags[data.synchronizationId].ordersUpdated) {
            delete this._synchronizationFlags[data.synchronizationId];
          }
        }
      } else if (data.type === 'deals') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        for (let deal of (data.deals || [])) {
          const onDealAddedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onDealAddedPromises.push(this._processEvent(
              () => listener.onDealAdded(instanceIndex, deal),
              `${primaryAccountId}:${instanceIndex}:onDealAdded`));
          }
          await Promise.all(onDealAddedPromises);
        }
      } else if (data.type === 'orders') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        const onPendingOrdersReplacedPromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          onPendingOrdersReplacedPromises.push(
            Promise.resolve((async () => {
              await this._processEvent(
                () => listener.onPendingOrdersReplaced(instanceIndex, data.orders || []),
                `${primaryAccountId}:${instanceIndex}:onPendingOrdersReplaced`, true);
              await this._processEvent(
                () => listener.onPendingOrdersSynchronized(instanceIndex, data.synchronizationId),
                `${primaryAccountId}:${instanceIndex}:onPendingOrdersSynchronized`, true);
            })())
              .catch(err => this._logger.error(`${primaryAccountId}:${instanceIndex}: Failed to notify listener ` +
                'about orders event', err))
          );
        }
        await Promise.all(onPendingOrdersReplacedPromises);
        if(this._synchronizationFlags[data.synchronizationId]) {
          delete this._synchronizationFlags[data.synchronizationId];
        }
      } else if (data.type === 'historyOrders') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        for (let historyOrder of (data.historyOrders || [])) {
          const onHistoryOrderAddedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onHistoryOrderAddedPromises.push(this._processEvent(
              () => listener.onHistoryOrderAdded(instanceIndex, historyOrder),
              `${primaryAccountId}:${instanceIndex}:onHistoryOrderAdded`));
          }
          await Promise.all(onHistoryOrderAddedPromises);
        }
      } else if (data.type === 'positions') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        const onPositionsReplacedPromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          onPositionsReplacedPromises.push(Promise.resolve((async () => {
            await this._processEvent(
              () => listener.onPositionsReplaced(instanceIndex, data.positions || []),
              `${primaryAccountId}:${instanceIndex}:onPositionsReplaced`, true);
            await this._processEvent(
              () => listener.onPositionsSynchronized(instanceIndex, data.synchronizationId),
              `${primaryAccountId}:${instanceIndex}:onPositionsSynchronized`, true);
            if(this._synchronizationFlags[data.synchronizationId] && 
              !this._synchronizationFlags[data.synchronizationId].ordersUpdated) {
              await this._processEvent(
                () => listener.onPendingOrdersSynchronized(instanceIndex, data.synchronizationId),
                `${primaryAccountId}:${instanceIndex}:onPendingOrdersSynchronized`, true);
            }
          })())
            .catch(err => this._logger.error(`${primaryAccountId}:${instanceIndex}: Failed to notify listener ` +
              'about positions event', err))
          );
        }
        await Promise.all(onPositionsReplacedPromises);
        if(this._synchronizationFlags[data.synchronizationId] && 
          !this._synchronizationFlags[data.synchronizationId].ordersUpdated) {
          delete this._synchronizationFlags[data.synchronizationId];
        }
      } else if (data.type === 'update') {
        if (data.accountInformation) {
          const onAccountInformationUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onAccountInformationUpdatedPromises.push(this._processEvent(
              () => listener.onAccountInformationUpdated(instanceIndex, data.accountInformation),
              `${primaryAccountId}:${instanceIndex}:onAccountInformationUpdated`));
          }
          await Promise.all(onAccountInformationUpdatedPromises);
        }
        for (let position of (data.updatedPositions || [])) {
          const onPositionUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onPositionUpdatedPromises.push(this._processEvent(
              () => listener.onPositionUpdated(instanceIndex, position),
              `${primaryAccountId}:${instanceIndex}:onPositionUpdated`));
          }
          await Promise.all(onPositionUpdatedPromises);
        }
        for (let positionId of (data.removedPositionIds || [])) {
          const onPositionRemovedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onPositionRemovedPromises.push(this._processEvent(
              () => listener.onPositionRemoved(instanceIndex, positionId),
              `${primaryAccountId}:${instanceIndex}:onPositionRemoved`));
          }
          await Promise.all(onPositionRemovedPromises);
        }
        for (let order of (data.updatedOrders || [])) {
          const onPendingOrderUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onPendingOrderUpdatedPromises.push(this._processEvent(
              () => listener.onPendingOrderUpdated(instanceIndex, order),
              `${primaryAccountId}:${instanceIndex}:onPendingOrderUpdated`));
          }
          await Promise.all(onPendingOrderUpdatedPromises);
        }
        for (let orderId of (data.completedOrderIds || [])) {
          const onPendingOrderCompletedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onPendingOrderCompletedPromises.push(this._processEvent(
              () => listener.onPendingOrderCompleted(instanceIndex, orderId),
              `${primaryAccountId}:${instanceIndex}:onPendingOrderCompleted`));
          }
          await Promise.all(onPendingOrderCompletedPromises);
        }
        for (let historyOrder of (data.historyOrders || [])) {
          const onHistoryOrderAddedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onHistoryOrderAddedPromises.push(this._processEvent(
              () => listener.onHistoryOrderAdded(instanceIndex, historyOrder),
              `${primaryAccountId}:${instanceIndex}:onHistoryOrderAdded`));
          }
          await Promise.all(onHistoryOrderAddedPromises);
        }
        for (let deal of (data.deals || [])) {
          const onDealAddedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onDealAddedPromises.push(this._processEvent(
              () => listener.onDealAdded(instanceIndex, deal),
              `${primaryAccountId}:${instanceIndex}:onDealAdded`));
          }
          await Promise.all(onDealAddedPromises);
        }
        if (data.timestamps) {
          data.timestamps.clientProcessingFinished = new Date();
          const onUpdatePromises = [];
          // eslint-disable-next-line max-depth
          for (let listener of this._latencyListeners || []) {
            onUpdatePromises.push(this._processEvent(
              () => listener.onUpdate(data.accountId, data.timestamps),
              `${primaryAccountId}:${instanceIndex}:onUpdate`));
          }
          await Promise.all(onUpdatePromises);
        }
      } else if (data.type === 'dealSynchronizationFinished') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          delete this._synchronizationIdByInstance[instanceId];
          return;
        }
        this._latencyService.onDealsSynchronized(instanceId);
        const onDealsSynchronizedPromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          if(socketInstance) {
            socketInstance.synchronizationThrottler.removeSynchronizationId(data.synchronizationId);
          }
          onDealsSynchronizedPromises.push(this._processEvent(
            () => listener.onDealsSynchronized(instanceIndex, data.synchronizationId),
            `${primaryAccountId}:${instanceIndex}:onDealsSynchronized`));
        }
        await Promise.all(onDealsSynchronizedPromises);
      } else if (data.type === 'orderSynchronizationFinished') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        const onHistoryOrdersSynchronizedPromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          onHistoryOrdersSynchronizedPromises.push(this._processEvent(
            () => listener.onHistoryOrdersSynchronized(instanceIndex, data.synchronizationId),
            `${primaryAccountId}:${instanceIndex}:onHistoryOrdersSynchronized`));
        }
        await Promise.all(onHistoryOrdersSynchronizedPromises);
      } else if (data.type === 'status') {
        if (!this._connectedHosts[instanceId]) {
          if(this._statusTimers[instanceId] && data.authenticated && 
              (this._subscriptionManager.isDisconnectedRetryMode(data.accountId, instanceNumber) || 
              !this._subscriptionManager.isAccountSubscribing(data.accountId, instanceNumber))) {
            this._subscriptionManager.cancelSubscribe(data.accountId + ':' + instanceNumber);
            await new Promise(res => setTimeout(res, 10));
            // eslint-disable-next-line no-console
            this._logger.info('it seems like we are not connected to a running API ' +
              'server yet, retrying subscription for account ' + instanceId);
            this.ensureSubscribe(data.accountId, instanceNumber);
          }
        } else {
          resetDisconnectTimer();
          const onBrokerConnectionStatusChangedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onBrokerConnectionStatusChangedPromises.push(this._processEvent(
              () => listener.onBrokerConnectionStatusChanged(instanceIndex, !!data.connected),
              `${primaryAccountId}:${instanceIndex}:onBrokerConnectionStatusChanged`));
          }
          await Promise.all(onBrokerConnectionStatusChangedPromises);
          if (data.healthStatus) {
            const onHealthStatusPromises = [];
            // eslint-disable-next-line max-depth
            for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
              onHealthStatusPromises.push(this._processEvent(
                () => listener.onHealthStatus(instanceIndex, data.healthStatus),
                `${primaryAccountId}:${instanceIndex}:onHealthStatus`));
            }
            await Promise.all(onHealthStatusPromises);
          }
        }
      } else if (data.type === 'downgradeSubscription') {
        // eslint-disable-next-line no-console
        this._logger.info(`${primaryAccountId}:${instanceIndex}: Market data subscriptions for symbol ` +
          `${data.symbol} were downgraded by the server due to rate limits. Updated subscriptions: ` +
          `${JSON.stringify(data.updates)}, removed subscriptions: ${JSON.stringify(data.unsubscriptions)}. ` +
          'Please read https://metaapi.cloud/docs/client/rateLimiting/ for more details.');
        const onSubscriptionDowngradePromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          onSubscriptionDowngradePromises.push(this._processEvent(
            () => listener.onSubscriptionDowngraded(instanceIndex, data.symbol, data.updates, data.unsubscriptions),
            `${primaryAccountId}:${instanceIndex}:onSubscriptionDowngraded`));
        }
        await Promise.all(onSubscriptionDowngradePromises);
      } else if (data.type === 'specifications') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        const onSymbolSpecificationsUpdatedPromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          onSymbolSpecificationsUpdatedPromises.push(this._processEvent(
            () => listener.onSymbolSpecificationsUpdated(instanceIndex, data.specifications || [],
              data.removedSymbols || []), `${primaryAccountId}:${instanceIndex}:onSymbolSpecificationsUpdated`));
        }
        await Promise.all(onSymbolSpecificationsUpdatedPromises);
        for (let specification of (data.specifications || [])) {
          const onSymbolSpecificationUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onSymbolSpecificationUpdatedPromises.push(this._processEvent(
              () => listener.onSymbolSpecificationUpdated(instanceIndex, specification),
              `${primaryAccountId}:${instanceIndex}:onSymbolSpecificationUpdated`));
          }
          await Promise.all(onSymbolSpecificationUpdatedPromises);
        }
        for (let removedSymbol of (data.removedSymbols || [])) {
          const onSymbolSpecificationRemovedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onSymbolSpecificationRemovedPromises.push(this._processEvent(
              () => listener.onSymbolSpecificationRemoved(instanceIndex, removedSymbol),
              `${primaryAccountId}:${instanceIndex}:onSymbolSpecificationRemoved`));
          }
          await Promise.all(onSymbolSpecificationRemovedPromises);
        }
      } else if (data.type === 'prices') {
        if (data.synchronizationId && data.synchronizationId !== this._synchronizationIdByInstance[instanceId]) {
          return;
        }
        let prices = data.prices || [];
        let candles = data.candles || [];
        let ticks = data.ticks || [];
        let books = data.books || [];
        const onSymbolPricesUpdatedPromises = [];
        for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
          if (prices.length) {
            onSymbolPricesUpdatedPromises.push(this._processEvent(
              () => listener.onSymbolPricesUpdated(instanceIndex, prices, data.equity, data.margin, data.freeMargin,
                data.marginLevel, data.accountCurrencyExchangeRate),
              `${primaryAccountId}:${instanceIndex}:onSymbolPricesUpdated`));
          }
          if (candles.length) {
            onSymbolPricesUpdatedPromises.push(this._processEvent(
              () => listener.onCandlesUpdated(instanceIndex, candles, data.equity, data.margin, data.freeMargin,
                data.marginLevel, data.accountCurrencyExchangeRate),
              `${primaryAccountId}:${instanceIndex}:onCandlesUpdated`));
          }
          if (ticks.length) {
            onSymbolPricesUpdatedPromises.push(this._processEvent(
              () => listener.onTicksUpdated(instanceIndex, ticks, data.equity, data.margin, data.freeMargin,
                data.marginLevel, data.accountCurrencyExchangeRate),
              `${primaryAccountId}:${instanceIndex}:onTicksUpdated`));
          }
          if (books.length) {
            onSymbolPricesUpdatedPromises.push(this._processEvent(
              () => listener.onBooksUpdated(instanceIndex, books, data.equity, data.margin, data.freeMargin,
                data.marginLevel, data.accountCurrencyExchangeRate),
              `${primaryAccountId}:${instanceIndex}:onBooksUpdated`));
          }
        }
        await Promise.all(onSymbolPricesUpdatedPromises);
        for (let price of prices) {
          const onSymbolPriceUpdatedPromises = [];
          for (let listener of this._synchronizationListeners[primaryAccountId] || []) {
            onSymbolPriceUpdatedPromises.push(this._processEvent(
              () => listener.onSymbolPriceUpdated(instanceIndex, price),
              `${primaryAccountId}:${instanceIndex}:onSymbolPriceUpdated`));
          }
          await Promise.all(onSymbolPriceUpdatedPromises);
        }
        for (let price of prices) {
          if (price.timestamps) {
            price.timestamps.clientProcessingFinished = new Date();
            const onSymbolPricePromises = [];
            // eslint-disable-next-line max-depth
            for (let listener of this._latencyListeners || []) {
              onSymbolPricePromises.push(this._processEvent(
                () => listener.onSymbolPrice(data.accountId, price.symbol, price.timestamps),
                `${primaryAccountId}:${instanceIndex}:onSymbolPrice`));
            }
            await Promise.all(onSymbolPricePromises);
          }
        }
      }
    } catch (err) {
      this._logger.error('Failed to process incoming synchronization packet', err);
    }
  }

  async _processEvent(callable, label, throwError) {
    const startTime = Date.now();
    let isLongEvent = false;
    let isEventDone = false;

    const checkLongEvent = async () => {
      await new Promise(res => setTimeout(res, 1000));
      if (!isEventDone) {
        isLongEvent = true;
        this._logger.warn(`${label}: event is taking more than 1 second to process`);
      }
    };

    checkLongEvent();
    try {
      await callable();
    } catch (err) {
      if (throwError) {
        throw err;
      }
      this._logger.error(`${label}: event failed with error`, err);
    }
    isEventDone = true;
    if (isLongEvent) {
      this._logger.warn(`${label}: finished in ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
    }
  }

  async _fireReconnected(instanceNumber, socketInstanceIndex, region) {
    try {
      const reconnectListeners = [];
      for (let listener of this._reconnectListeners) {
        if (this._socketInstancesByAccounts[instanceNumber][listener.accountId] === socketInstanceIndex && 
          this.getAccountRegion(listener.accountId) === region) {
          reconnectListeners.push(listener);
        }
      }
      Object.keys(this._synchronizationFlags).forEach(synchronizationId => {
        const accountId = this._synchronizationFlags[synchronizationId].accountId;
        if (this._socketInstancesByAccounts[instanceNumber][accountId] === socketInstanceIndex
          && this._synchronizationFlags[synchronizationId].instanceNumber === instanceNumber
          && this._regionsByAccounts[accountId]
          && this._regionsByAccounts[accountId].region === region) {
          delete this._synchronizationFlags[synchronizationId];
        }
      });
      const reconnectAccountIds = reconnectListeners.map(listener => listener.accountId);
      this._subscriptionManager.onReconnected(instanceNumber, socketInstanceIndex, reconnectAccountIds);
      this._packetOrderer.onReconnected(reconnectAccountIds);

      for (let listener of reconnectListeners) {
        Promise.resolve(listener.listener.onReconnected(region, instanceNumber))
          .catch(err => this._logger.error('Failed to notify reconnect listener', err));
      }
    } catch (err) {
      this._logger.error('Failed to process reconnected event', err);
    }
  }

  _getSocketInstanceByAccount(accountId, instanceNumber) {
    const region = this.getAccountRegion(accountId);
    return this._socketInstances[region][instanceNumber][this._socketInstancesByAccounts[instanceNumber][accountId]];
  }

  async getUrlSettings(instanceNumber, region) {
    if(this._url) {
      return {url: this._url, isSharedClientApi: true};
    }

    const urlSettings = await this._domainClient.getSettings();
    const getUrl = (hostname) => 
      `https://${hostname}.${region}-${String.fromCharCode(97 + Number(instanceNumber))}.${urlSettings.domain}`;

    let url;
    if(this._useSharedClientApi) {
      url = getUrl(this._hostname);
    } else {
      url = getUrl(urlSettings.hostname);
    }
    const isSharedClientApi = url === getUrl(this._hostname);
    return {url, isSharedClientApi};
  }

  // eslint-disable-next-line complexity
  async _getServerUrl(instanceNumber, socketInstanceIndex, region) {
    if(this._url) {
      return this._url;
    }

    while(this.socketInstances[region][instanceNumber][socketInstanceIndex].connected) {
      try {
        const urlSettings = await this.getUrlSettings(instanceNumber, region);
        const url = urlSettings.url;
        const isSharedClientApi = urlSettings.isSharedClientApi;
        let logMessage = 'Connecting MetaApi websocket client to the MetaApi server ' +
      `via ${url} ${isSharedClientApi ? 'shared' : 'dedicated'} server.`;
        if(this._firstConnect && !isSharedClientApi) {
          logMessage += ' Please note that it can take up to 3 minutes for your dedicated server to start for the ' +
        'first time. During this time it is OK if you see some connection errors.';
          this._firstConnect = false;
        }
        this._logger.info(logMessage);
        return url;
      } catch (err) {
        this._logger.error('Failed to retrieve server URL', err);
        await new Promise(res => setTimeout(res, 1000));
      }
    }
  }

  _throttleRequest(type, accountId, instanceNumber, timeInMs) {
    this._lastRequestsTime[instanceNumber] = this._lastRequestsTime[instanceNumber] || {};
    this._lastRequestsTime[instanceNumber][type] = this._lastRequestsTime[instanceNumber][type] || {};
    let lastTime = this._lastRequestsTime[instanceNumber][type][accountId];
    if (!lastTime || (lastTime < Date.now() - timeInMs)) {
      this._lastRequestsTime[instanceNumber][type][accountId] = Date.now();
      return !!lastTime;
    }
    return false;
  }

  _refreshAccountRegion(accountId) {
    if(this._regionsByAccounts[accountId]) {
      this._regionsByAccounts[accountId].lastUsed = Date.now();
    }
  }

  //eslint-disable-next-line complexity
  async _createSocketInstanceByAccount(accountId, instanceNumber) {
    const region = this.getAccountRegion(accountId);
    if (this._socketInstancesByAccounts[instanceNumber][accountId] === undefined) {
      let socketInstanceIndex = null;
      while (this._subscribeLock && ((new Date(this._subscribeLock.recommendedRetryTime).getTime() > Date.now() && 
          this.subscribedAccountIds(instanceNumber, undefined, region).length < 
          this._subscribeLock.lockedAtAccounts) || 
          (new Date(this._subscribeLock.lockedAtTime).getTime() + this._subscribeCooldownInSeconds * 1000 > 
          Date.now() && this.subscribedAccountIds(instanceNumber, undefined, region).length >= 
          this._subscribeLock.lockedAtAccounts))) {
        await new Promise(res => setTimeout(res, 1000));
      }
      for (let index = 0; index < this._socketInstances[region][instanceNumber].length; index++) {
        const accountCounter = this.getAssignedAccounts(instanceNumber, index, region).length;
        const instance = this.socketInstances[region][instanceNumber][index];
        if (instance.subscribeLock) {
          if (instance.subscribeLock.type === 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER_PER_SERVER' && 
            (new Date(instance.subscribeLock.recommendedRetryTime).getTime() > Date.now() || 
            this.subscribedAccountIds(instanceNumber, index, region).length >= 
            instance.subscribeLock.lockedAtAccounts)) {
            continue;
          }
          if (instance.subscribeLock.type === 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_SERVER' && 
            new Date(instance.subscribeLock.recommendedRetryTime).getTime() > Date.now() &&
            this.subscribedAccountIds(instanceNumber, index, region).length >= 
            instance.subscribeLock.lockedAtAccounts) {
            continue;
          }
        }
        if(accountCounter < this._maxAccountsPerInstance) {
          socketInstanceIndex = index;
          break;
        }
      }
      if(socketInstanceIndex === null) {
        socketInstanceIndex = this._socketInstances[region][instanceNumber].length;
        await this.connect(instanceNumber, region);
      }
      this._socketInstancesByAccounts[instanceNumber][accountId] = socketInstanceIndex;
    }
  }  

  _clearAccountCacheJob() {
    const date = Date.now();
    Object.keys(this._regionsByAccounts).forEach(accountId => {
      const data = this._regionsByAccounts[accountId];
      if(data.connections === 0 && date - data.lastUsed > 2 * 60 * 60 * 1000) {
        const primaryAccountId = this._accountsByReplicaId[accountId];
        const replicas = Object.values(this._accountReplicas[primaryAccountId]);
        replicas.forEach(replica => {
          delete this._accountsByReplicaId[replica];
          delete this._regionsByAccounts[replica];
        });
        delete this._accountReplicas[primaryAccountId];
      }
    });
  }

}
