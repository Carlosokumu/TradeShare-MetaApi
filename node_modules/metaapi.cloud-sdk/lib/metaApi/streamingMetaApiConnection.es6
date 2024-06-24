'use strict';

import TerminalState from './terminalState';
import MemoryHistoryStorage from './memoryHistoryStorage';
import TimeoutError from '../clients/timeoutError';
import randomstring from 'randomstring';
import ConnectionHealthMonitor from './connectionHealthMonitor';
import {ValidationError} from '../clients/errorHandler';
import OptionsValidator from '../clients/optionsValidator';
import LoggerManager from '../logger';
import MetaApiConnection from './metaApiConnection';

/**
 * Exposes MetaApi MetaTrader streaming API connection to consumers
 */
export default class StreamingMetaApiConnection extends MetaApiConnection {

  /**
   * Constructs MetaApi MetaTrader streaming Api connection
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {ClientApiClient} clientApiClient client api client
   * @param {MetatraderAccount} account MetaTrader account id to connect to
   * @param {HistoryStorage} historyStorage terminal history storage. By default an instance of MemoryHistoryStorage
   * will be used.
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {Date} [historyStartTime] history start sync time
   * @param {RefreshSubscriptionsOpts} [refreshSubscriptionsOpts] subscriptions refresh options
   */
  constructor(websocketClient, clientApiClient, account, historyStorage, connectionRegistry, historyStartTime,
    refreshSubscriptionsOpts) {
    super(websocketClient, account);
    refreshSubscriptionsOpts = refreshSubscriptionsOpts || {};
    const validator = new OptionsValidator();
    this._minSubscriptionRefreshInterval = validator.validateNonZero(refreshSubscriptionsOpts.minDelayInSeconds, 1,
      'refreshSubscriptionsOpts.minDelayInSeconds');
    this._maxSubscriptionRefreshInterval = validator.validateNonZero(refreshSubscriptionsOpts.maxDelayInSeconds, 600,
      'refreshSubscriptionsOpts.maxDelayInSeconds');
    this._connectionRegistry = connectionRegistry;
    this._historyStartTime = historyStartTime;
    this._terminalState = new TerminalState(this._account.id, clientApiClient);
    this._historyStorage = historyStorage || new MemoryHistoryStorage();
    this._healthMonitor = new ConnectionHealthMonitor(this);
    this._websocketClient.addSynchronizationListener(account.id, this);
    this._websocketClient.addSynchronizationListener(account.id, this._terminalState);
    this._websocketClient.addSynchronizationListener(account.id, this._historyStorage);
    this._websocketClient.addSynchronizationListener(account.id, this._healthMonitor);
    Object.values(account.accountRegions)
      .forEach(replicaId => this._websocketClient.addReconnectListener(this, replicaId));
    this._subscriptions = {};
    this._stateByInstanceIndex = {};
    this._refreshMarketDataSubscriptionSessions = {};
    this._refreshMarketDataSubscriptionTimeouts = {};
    this._synchronizationListeners = [];
    this._logger = LoggerManager.getLogger('MetaApiConnection');
  }

  /**
   * Opens the connection. Can only be called the first time, next calls will be ignored.
   * @return {Promise} promise resolving when the connection is opened
   */
  async connect() {
    if (!this._opened) {
      this._logger.trace(`${this._account.id}: Opening connection`);
      this._opened = true;
      try {
        await this.initialize();
        await this.subscribe();
      } catch (err) {
        await this.close();
        throw err;
      }
    }
  }

  /**
   * Clears the order and transaction history of a specified application and removes application (see
   * https://metaapi.cloud/docs/client/websocket/api/removeApplication/).
   * @return {Promise} promise resolving when the history is cleared and application is removed
   */
  removeApplication() {
    this._checkIsConnectionActive();
    this._historyStorage.clear();
    return this._websocketClient.removeApplication(this._account.id);
  }

  /**
   * Requests the terminal to start synchronization process
   * (see https://metaapi.cloud/docs/client/websocket/synchronizing/synchronize/)
   * @param {String} instanceIndex instance index
   * @returns {Promise} promise which resolves when synchronization started
   */
  async synchronize(instanceIndex) {
    this._checkIsConnectionActive();
    const region = this.getRegion(instanceIndex);
    const instance = this.getInstanceNumber(instanceIndex);
    const host = this.getHostName(instanceIndex);
    let startingHistoryOrderTime = new Date(Math.max(
      (this._historyStartTime || new Date(0)).getTime(),
      (await this._historyStorage.lastHistoryOrderTime(instance)).getTime()
    ));
    let startingDealTime = new Date(Math.max(
      (this._historyStartTime || new Date(0)).getTime(),
      (await this._historyStorage.lastDealTime(instance)).getTime()
    ));
    let synchronizationId = randomstring.generate(32);
    this._getState(instanceIndex).lastSynchronizationId = synchronizationId;
    const accountId = this._account.accountRegions[region];
    this._logger.debug(`${this._account.id}:${instanceIndex}: initiating synchronization ${synchronizationId}`);
    return this._websocketClient.synchronize(accountId, instance, host, synchronizationId,
      startingHistoryOrderTime, startingDealTime,
      async () => await this.terminalState.getHashes(this._account.type, instanceIndex));
  }

  /**
   * Initializes meta api connection
   * @return {Promise} promise which resolves when meta api connection is initialized
   */
  async initialize() {
    this._checkIsConnectionActive();
    await this._historyStorage.initialize(this._account.id, this._connectionRegistry.application);
    this._websocketClient.addAccountCache(this._account.id, this._account.accountRegions);
  }

  /**
   * Initiates subscription to MetaTrader terminal
   * @returns {Promise} promise which resolves when subscription is initiated
   */
  async subscribe() {
    this._checkIsConnectionActive();
    const accountRegions = this._account.accountRegions;
    Object.values(accountRegions).forEach(replicaId => {
      this._websocketClient.ensureSubscribe(replicaId, 0);
      this._websocketClient.ensureSubscribe(replicaId, 1);
    });
  }

  /**
   * Subscribes on market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/subscribeToMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataSubscription>} subscriptions array of market data subscription to create or update. Please
   * note that this feature is not fully implemented on server-side yet
   * @param {number} [timeoutInSeconds] timeout to wait for prices in seconds, default is 30
   * @returns {Promise} promise which resolves when subscription request was processed
   */
  async subscribeToMarketData(symbol, subscriptions, timeoutInSeconds) {
    this._checkIsConnectionActive();
    if(!this._terminalState.specification(symbol)){
      throw new ValidationError(`Cannot subscribe to market data for symbol ${symbol} because ` +
      'symbol does not exist');
    } else {
      subscriptions = subscriptions || [{type: 'quotes'}];
      if(this._subscriptions[symbol]) {
        const prevSubscriptions = this._subscriptions[symbol].subscriptions;
        subscriptions.forEach(subscription => {
          const index = subscription.type === 'candles' ? 
            prevSubscriptions.findIndex(item => item.type === subscription.type && 
            item.timeframe === subscription.timeframe) :
            prevSubscriptions.findIndex(item => item.type === subscription.type);
          if(index === -1){
            prevSubscriptions.push(subscription);
          } else {
            prevSubscriptions[index] = subscription;
          }
        });
      } else {
        this._subscriptions[symbol] = {subscriptions};
      }
      await this._websocketClient.subscribeToMarketData(this._account.id, symbol, subscriptions,
        this._account.reliability);
      return this.terminalState.waitForPrice(symbol, timeoutInSeconds);
    }
  }

  /**
   * Unsubscribes from market data of specified symbol (see
   * https://metaapi.cloud/docs/client/websocket/marketDataStreaming/unsubscribeFromMarketData/).
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @param {Array<MarketDataUnsubscription>} subscriptions array of subscriptions to cancel
   * @returns {Promise} promise which resolves when unsubscription request was processed
   */
  unsubscribeFromMarketData(symbol, subscriptions) {
    this._checkIsConnectionActive();
    if (!subscriptions) {
      delete this._subscriptions[symbol];
    } else if (this._subscriptions[symbol]) {
      this._subscriptions[symbol].subscriptions = this._subscriptions[symbol].subscriptions
        .filter(s => s.type === 'candles' ? 
          !subscriptions.find(s2 => s.type === s2.type && s.timeframe === s2.timeframe) : 
          !subscriptions.find(s2 => s.type === s2.type));
      if (!this._subscriptions[symbol].subscriptions.length) {
        delete this._subscriptions[symbol];
      }
    }
    return this._websocketClient.unsubscribeFromMarketData(this._account.id, symbol, subscriptions,
      this._account.reliability);
  }

  /**
   * Invoked when subscription downgrade has occurred
   * @param {String} instanceIndex index of an account instance connected
   * @param {string} symbol symbol to update subscriptions for
   * @param {Array<MarketDataSubscription>} updates array of market data subscription to update
   * @param {Array<MarketDataUnsubscription>} unsubscriptions array of subscriptions to cancel
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  // eslint-disable-next-line complexity
  async onSubscriptionDowngraded(instanceIndex, symbol, updates, unsubscriptions) {
    let subscriptions = this._subscriptions[symbol] || [];
    if (unsubscriptions && unsubscriptions.length) {
      if (subscriptions) {
        for (let subscription of unsubscriptions) {
          subscriptions = subscriptions.filter(s => s.type === subscription.type);
        }
      }
      this.unsubscribeFromMarketData(symbol, unsubscriptions)
        .catch(err => {
          if (err.name !== ValidationError) {
            this._logger.error(`${this._account.id}: failed do unsubscribe from market data on subscription downgraded`,
              err);
          } else {
            this._logger.trace(`${this._account.id}: failed do unsubscribe from market data on subscription downgraded`,
              err);
          }
        });
    }
    if (updates && updates.length) {
      if (subscriptions) {
        for (let subscription of updates) {
          subscriptions.filter(s => s.type === subscription.type)
            .forEach(s => s.intervalInMilliiseconds = subscription.intervalInMilliseconds);
        }
      }
      this.subscribeToMarketData(symbol, updates)
        .catch(err => {
          this._logger.error(`${this._account.id}: failed do unsubscribe from market data on subscription downgraded`,
            err);
        });
    }
    if (subscriptions && !subscriptions.length) {
      delete this._subscriptions[symbol];
    }
  }

  /**
   * Returns list of the symbols connection is subscribed to
   * @returns {Array<String>} list of the symbols connection is subscribed to
   */
  get subscribedSymbols() {
    return Object.keys(this._subscriptions);
  }

  /**
   * Returns subscriptions for a symbol
   * @param {string} symbol symbol to retrieve subscriptions for
   * @returns {Array<MarketDataSubscription>} list of market data subscriptions for the symbol
   */
  subscriptions(symbol) {
    this._checkIsConnectionActive();
    return (this._subscriptions[symbol] || {}).subscriptions;
  }

  /**
   * Sends client uptime stats to the server.
   * @param {Object} uptime uptime statistics to send to the server
   * @returns {Promise} promise which resolves when uptime statistics is submitted
   */
  saveUptime(uptime) {
    this._checkIsConnectionActive();
    return this._websocketClient.saveUptime(this._account.id, uptime);
  }

  /**
   * Returns local copy of terminal state
   * @returns {TerminalState} local copy of terminal state
   */
  get terminalState() {
    return this._terminalState;
  }

  /**
   * Returns local history storage
   * @returns {HistoryStorage} local history storage
   */
  get historyStorage() {
    return this._historyStorage;
  }

  /**
   * Adds synchronization listener
   * @param {SynchronizationListener} listener synchronization listener to add
   */
  addSynchronizationListener(listener) {
    this._synchronizationListeners.push(listener);
    this._websocketClient.addSynchronizationListener(this._account.id, listener);
  }

  /**
   * Removes synchronization listener for specific account
   * @param {SynchronizationListener} listener synchronization listener to remove
   */
  removeSynchronizationListener(listener) {
    this._synchronizationListeners = this._synchronizationListeners.filter(l => l !== listener);
    this._websocketClient.removeSynchronizationListener(this._account.id, listener);
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   * @param {Number} replicas number of account replicas launched
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onConnected(instanceIndex, replicas) {
    let key = randomstring.generate(32);
    let state = this._getState(instanceIndex);
    state.shouldSynchronize = key;
    state.synchronizationRetryIntervalInSeconds = 1;
    state.synchronized = false;
    this._ensureSynchronized(instanceIndex, key);
    this._logger.debug(`${this._account.id}:${instanceIndex}: connected to broker`);
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   */
  async onDisconnected(instanceIndex) {
    let state = this._getState(instanceIndex);
    state.lastDisconnectedSynchronizationId = state.lastSynchronizationId;
    state.lastSynchronizationId = undefined;
    state.shouldSynchronize = undefined;
    state.synchronized = false;
    state.disconnected = true;
    const instanceNumber = this.getInstanceNumber(instanceIndex);
    const region = this.getRegion(instanceIndex);
    const instance = `${region}:${instanceNumber}`;
    delete this._refreshMarketDataSubscriptionSessions[instance];
    clearTimeout(this._refreshMarketDataSubscriptionTimeouts[instance]);
    delete this._refreshMarketDataSubscriptionTimeouts[instance];
    if (state.synchronizationTimeout) {
      clearTimeout(state.synchronizationTimeout);
      delete state.synchronizationTimeout;
    }
    if (state.ensureSynchronizeTimeout) {
      clearTimeout(state.ensureSynchronizeTimeout);
      delete state.ensureSynchronizeTimeout;
    }
    this._logger.debug(`${this._account.id}:${instanceIndex}: disconnected from broker`);
  }

  /**
   * Invoked when a symbol specifications were updated
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   */
  onSymbolSpecificationsUpdated(instanceIndex, specifications, removedSymbols) {
    this._scheduleSynchronizationTimeout(instanceIndex);
  }

  /**
   * Invoked when position synchronization finished to indicate progress of an initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   */
  onPositionsSynchronized(instanceIndex, synchronizationId) {
    this._scheduleSynchronizationTimeout(instanceIndex);
  }

  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   */
  onPendingOrdersSynchronized(instanceIndex, synchronizationId) {
    this._scheduleSynchronizationTimeout(instanceIndex);
  }

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onDealsSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.dealsSynchronized[synchronizationId] = true;
    this._scheduleSynchronizationTimeout(instanceIndex);
    this._logger.debug(`${this._account.id}:${instanceIndex}: finished synchronization ${synchronizationId}`);
  }

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onHistoryOrdersSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.ordersSynchronized[synchronizationId] = true;
    this._scheduleSynchronizationTimeout(instanceIndex);
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect
   * @param {String} region reconnected region
   * @param {Number} instanceNumber reconnected instance number
   * @return {Promise} promise which resolves when connection to MetaApi websocket API restored after a disconnect
   */
  async onReconnected(region, instanceNumber) {
    const instanceTemplate = `${region}:${instanceNumber}`;
    Object.keys(this._stateByInstanceIndex)
      .filter(key => key.startsWith(`${instanceTemplate}:`)).forEach(key => {
        delete this._stateByInstanceIndex[key];
      });
    delete this._refreshMarketDataSubscriptionSessions[instanceTemplate];
    clearTimeout(this._refreshMarketDataSubscriptionTimeouts[instanceTemplate]);
    delete this._refreshMarketDataSubscriptionTimeouts[instanceTemplate];
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onStreamClosed(instanceIndex) {
    delete this._stateByInstanceIndex[instanceIndex];
  }

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onSynchronizationStarted(instanceIndex, specificationsUpdated, positionsUpdated, ordersUpdated,
    synchronizationId) {
    this._logger.debug(`${this._account.id}:${instanceIndex}: starting synchronization ${synchronizationId}`);
    const instanceNumber = this.getInstanceNumber(instanceIndex);
    const region = this.getRegion(instanceIndex);
    const instance = `${region}:${instanceNumber}`;
    const accountId = this._account.accountRegions[region];
    delete this._refreshMarketDataSubscriptionSessions[instance];
    let sessionId = randomstring.generate(32);
    this._refreshMarketDataSubscriptionSessions[instance] = sessionId;
    clearTimeout(this._refreshMarketDataSubscriptionTimeouts[instance]);
    delete this._refreshMarketDataSubscriptionTimeouts[instance];
    await this._refreshMarketDataSubscriptions(accountId, instanceNumber, sessionId);
    this._scheduleSynchronizationTimeout(instanceIndex);
    let state = this._getState(instanceIndex);
    if (state && !this._closed) {
      state.lastSynchronizationId = synchronizationId;
    }
  }

  /**
   * Invoked when account region has been unsubscribed
   * @param {String} region account region unsubscribed
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onUnsubscribeRegion(region) {
    Object.keys(this._refreshMarketDataSubscriptionTimeouts)
      .filter(instance => instance.startsWith(`${region}:`))
      .forEach(instance => {
        clearTimeout(this._refreshMarketDataSubscriptionTimeouts[instance]);
        delete this._refreshMarketDataSubscriptionTimeouts[instance];
        delete this._refreshMarketDataSubscriptionSessions[instance];
      });
    Object.keys(this._stateByInstanceIndex)
      .filter(instance => instance.startsWith(`${region}:`))
      .forEach(instance => delete this._stateByInstanceIndex[instance]);
  }

  /**
   * Returns flag indicating status of state synchronization with MetaTrader terminal
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} synchronizationId optional synchronization request id, last synchronization request id will be used
   * by default
   * @return {Promise<Boolean>} promise resolving with a flag indicating status of state synchronization with MetaTrader
   * terminal
   */
  async isSynchronized(instanceIndex, synchronizationId) {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => {
      if (instanceIndex !== undefined && s.instanceIndex !== instanceIndex) {
        return acc;
      }
      const checkSynchronizationId = synchronizationId || s.lastSynchronizationId;
      let synchronized = !!s.ordersSynchronized[checkSynchronizationId] && 
        !!s.dealsSynchronized[checkSynchronizationId];
      return acc || synchronized;
    }, false);
  }

  /**
   * @typedef {Object} SynchronizationOptions
   * @property {String} [applicationPattern] application regular expression pattern, default is .*
   * @property {String} [synchronizationId] synchronization id, last synchronization request id will be used by
   * default
   * @property {Number} [instanceIndex] index of an account instance to ensure synchronization on, default is to wait
   * for the first instance to synchronize
   * @param {Number} [timeoutInSeconds] wait timeout in seconds, default is 5m
   * @param {Number} [intervalInMilliseconds] interval between account reloads while waiting for a change, default is 1s
   */

  /**
   * Waits until synchronization to MetaTrader terminal is completed
   * @param {SynchronizationOptions} synchronization options
   * @return {Promise} promise which resolves when synchronization to MetaTrader terminal is completed
   * @throws {TimeoutError} if application failed to synchronize with the teminal within timeout allowed
   */
  // eslint-disable-next-line complexity
  async waitSynchronized(opts) {
    this._checkIsConnectionActive();
    opts = opts || {};
    let instanceIndex = opts.instanceIndex;
    let synchronizationId = opts.synchronizationId;
    let timeoutInSeconds = opts.timeoutInSeconds || 300;
    let intervalInMilliseconds = opts.intervalInMilliseconds || 1000;
    let applicationPattern = opts.applicationPattern ||
      (this._account.application === 'CopyFactory' ? 'CopyFactory.*|RPC' : 'RPC');
    let startTime = Date.now();
    let synchronized;
    while (!(synchronized = await this.isSynchronized(instanceIndex, synchronizationId)) &&
      (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await new Promise(res => setTimeout(res, intervalInMilliseconds));
    }
    let state;
    if (instanceIndex === undefined) {
      for (let s of Object.values(this._stateByInstanceIndex)) {
        if (await this.isSynchronized(s.instanceIndex, synchronizationId)) {
          state = s;
          instanceIndex = s.instanceIndex;
        }
      }
    } else {
      state = Object.values(this._stateByInstanceIndex).find(s => s.instanceIndex === instanceIndex);
    }
    if (!synchronized) {
      throw new TimeoutError('Timed out waiting for MetaApi to synchronize to MetaTrader account ' +
        this._account.id + ', synchronization id ' + (synchronizationId || (state && state.lastSynchronizationId) ||
          (state && state.lastDisconnectedSynchronizationId)));
    }
    let timeLeftInSeconds = Math.max(0, timeoutInSeconds - (Date.now() - startTime) / 1000);
    const region = this.getRegion(state.instanceIndex);
    const accountId = this._account.accountRegions[region];
    await this._websocketClient.waitSynchronized(accountId, this.getInstanceNumber(instanceIndex),
      applicationPattern, timeLeftInSeconds);
  }

  /**
   * Queues an event for processing among other synchronization events within same account
   * @param {String} name event label name
   * @param {Function} callable async or regular function to execute
   */
  queueEvent(name, callable) {
    this._websocketClient.queueEvent(this._account.id, name, callable);
  }

  /**
   * Closes the connection. The instance of the class should no longer be used after this method is invoked.
   */
  async close() {
    if (!this._closed) {
      this._logger.debug(`${this._account.id}: Closing connection`);
      this._stateByInstanceIndex = {};
      this._connectionRegistry.remove(this._account.id);
      const accountRegions = this._account.accountRegions;
      await Promise.all(Object.values(accountRegions).map(replicaId => 
        this._websocketClient.unsubscribe(replicaId)));
      this._websocketClient.removeSynchronizationListener(this._account.id, this);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._terminalState);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._historyStorage);
      this._websocketClient.removeSynchronizationListener(this._account.id, this._healthMonitor);
      for (let listener of this._synchronizationListeners) {
        this._websocketClient.removeSynchronizationListener(this._account.id, listener);
      }
      this._synchronizationListeners = [];
      this._websocketClient.removeReconnectListener(this);
      this._healthMonitor.stop();
      this._refreshMarketDataSubscriptionSessions = {};
      Object.values(this._refreshMarketDataSubscriptionTimeouts).forEach(timeout => clearTimeout(timeout));
      this._refreshMarketDataSubscriptionTimeouts = {};
      Object.values(accountRegions).forEach(replicaId => 
        this._websocketClient.removeAccountCache(replicaId));
      this._closed = true;
      this._logger.trace(`${this._account.id}: Closed connection`);
    }
  }

  /**
   * Returns synchronization status
   * @return {boolean} synchronization status
   */
  get synchronized() {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => acc || s.synchronized, false);
  }

  /**
   * Returns MetaApi account
   * @return {MetatraderAccount} MetaApi account
   */
  get account() {
    return this._account;
  }

  /**
   * Returns connection health monitor instance
   * @return {ConnectionHealthMonitor} connection health monitor instance
   */
  get healthMonitor() {
    return this._healthMonitor;
  }

  async _refreshMarketDataSubscriptions(accountId, instanceNumber, session) {
    const region = this._websocketClient.getAccountRegion(accountId);
    const instance = `${region}:${instanceNumber}`;
    try {
      if (this._refreshMarketDataSubscriptionSessions[instance] === session) {
        const subscriptionsList = [];
        Object.keys(this._subscriptions).forEach(key => {
          const subscriptions = this.subscriptions(key);
          const subscriptionsItem = {symbol: key};
          if(subscriptions) {
            subscriptionsItem.subscriptions = subscriptions;
          }
          subscriptionsList.push(subscriptionsItem);
        });
        await this._websocketClient.refreshMarketDataSubscriptions(accountId, instanceNumber,
          subscriptionsList);
      }
    } catch (err) {
      this._logger.error(`Error refreshing market data subscriptions job for account ${this._account.id} ` +
      `${instanceNumber}`, err);
    } finally {
      if (this._refreshMarketDataSubscriptionSessions[instance] === session) {
        let refreshInterval = (Math.random() * (this._maxSubscriptionRefreshInterval - 
          this._minSubscriptionRefreshInterval) + this._minSubscriptionRefreshInterval) * 1000;
        this._refreshMarketDataSubscriptionTimeouts[instance] = setTimeout(() =>
          this._refreshMarketDataSubscriptions(accountId, instanceNumber, session), refreshInterval);
      }
    }
  }

  _generateStopOptions(stopLoss, takeProfit) {
    let trade = {};
    if (typeof stopLoss === 'number') {
      trade.stopLoss = stopLoss;
    } else if (stopLoss) {
      trade.stopLoss = stopLoss.value;
      trade.stopLossUnits = stopLoss.units;
    }
    if (typeof takeProfit === 'number') {
      trade.takeProfit = takeProfit;
    } else if (takeProfit) {
      trade.takeProfit = takeProfit.value;
      trade.takeProfitUnits = takeProfit.units;
    }
    return trade;
  }

  async _ensureSynchronized(instanceIndex, key) {
    let state = this._getState(instanceIndex);
    if (state && state.shouldSynchronize && !this._closed) {
      try {
        const synchronizationResult = await this.synchronize(instanceIndex);
        if(synchronizationResult) {
          state.synchronized = true;
          state.synchronizationRetryIntervalInSeconds = 1;
          delete state.ensureSynchronizeTimeout;
        }
        this._scheduleSynchronizationTimeout(instanceIndex);
      } catch (err) {
        this._logger.error('MetaApi websocket client for account ' + this._account.id +
          ':' + instanceIndex + ' failed to synchronize', err);
        if (state.shouldSynchronize === key) {
          if (state.ensureSynchronizeTimeout) {
            clearTimeout(state.ensureSynchronizeTimeout);
          }
          state.ensureSynchronizeTimeout = setTimeout(this._ensureSynchronized.bind(this, instanceIndex, key),
            state.synchronizationRetryIntervalInSeconds * 1000);
          state.synchronizationRetryIntervalInSeconds = Math.min(state.synchronizationRetryIntervalInSeconds * 2, 300);
        }
      }
    }
  }

  _getState(instanceIndex) {
    if (!this._stateByInstanceIndex['' + instanceIndex]) {
      this._stateByInstanceIndex['' + instanceIndex] = {
        instanceIndex,
        ordersSynchronized: {},
        dealsSynchronized: {},
        shouldSynchronize: undefined,
        synchronizationRetryIntervalInSeconds: 1,
        synchronized: false,
        lastDisconnectedSynchronizationId: undefined,
        lastSynchronizationId: undefined,
        disconnected: false
      };
    }
    return this._stateByInstanceIndex['' + instanceIndex];
  }

  _scheduleSynchronizationTimeout(instanceIndex) {
    let state = this._getState(instanceIndex);
    if (state && !this._closed) {
      if (state.synchronizationTimeout) {
        clearTimeout(state.synchronizationTimeout);
      }
      let synchronizationTimeout = 2 * 60 * 1000;
      state.synchronizationTimeout =
        setTimeout(() => this._checkSynchronizationTimedOut(instanceIndex), synchronizationTimeout);
    }
  }

  _checkSynchronizationTimedOut(instanceIndex) {
    let state = this._getState(instanceIndex);
    if (state && !this._closed) {
      let synchronizationId = state.lastSynchronizationId;
      let synchronized = !!state.dealsSynchronized[synchronizationId];
      if (!synchronized && synchronizationId && state.shouldSynchronize) {
        this._logger.warn(`${this._account.id}:${instanceIndex}: resynchronized since latest synchronization ` +
          `${synchronizationId} did not finish in time`);
        this._ensureSynchronized(instanceIndex, state.shouldSynchronize);
      }
    }
  }

}
