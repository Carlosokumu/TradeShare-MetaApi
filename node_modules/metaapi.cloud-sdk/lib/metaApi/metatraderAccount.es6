'use strict';

import TimeoutError from '../clients/timeoutError';
import RpcMetaApiConnection from './rpcMetaApiConnection';
import HistoryDatabase from './historyDatabase/index';
import ExpertAdvisor from './expertAdvisor';
import {ValidationError} from '../clients/errorHandler';
import MetatraderAccountReplica from './metatraderAccountReplica';

/**
 * Implements a MetaTrader account entity
 */
export default class MetatraderAccount {

  /**
   * Constructs a MetaTrader account entity
   * @param {MetatraderAccountDto} data MetaTrader account data
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {ExpertAdvisorClient} expertAdvisorClient expert advisor REST API client
   * @param {HistoricalMarketDataClient} historicalMarketDataClient historical market data HTTP API client
   * @param {string} application application name
   */
  constructor(data, metatraderAccountClient, metaApiWebsocketClient, connectionRegistry, expertAdvisorClient, 
    historicalMarketDataClient, application) {
    this._data = data;
    this._metatraderAccountClient = metatraderAccountClient;
    this._metaApiWebsocketClient = metaApiWebsocketClient;
    this._connectionRegistry = connectionRegistry;
    this._expertAdvisorClient = expertAdvisorClient;
    this._historicalMarketDataClient = historicalMarketDataClient;
    this._application = application;
    this._replicas = (data.accountReplicas || [])
      .map(replica => new MetatraderAccountReplica(replica, this, metatraderAccountClient));
  }

  /**
   * Returns account id
   * @return {String} account id
   */
  get id() {
    return this._data._id;
  }

  /**
   * Returns account name
   * @return {String} account name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Returns account type. Possible values are cloud, cloud-g1, cloud-g2 and self-hosted.
   * @return {String} account type
   */
  get type() {
    return this._data.type;
  }

  /**
   * Returns account login
   * @return {String} account login
   */
  get login() {
    return this._data.login;
  }

  /**
   * Returns MetaTrader server which hosts the account
   * @return {String} MetaTrader server which hosts the account
   */
  get server() {
    return this._data.server;
  }

  /**
   * Returns id of the account's provisioning profile
   * @return {String} id of the account's provisioning profile
   */
  get provisioningProfileId() {
    return this._data.provisioningProfileId;
  }

  /**
   * Returns application name to connect the account to. Currently allowed values are MetaApi and AgiliumTrade
   * @return {String} application name to connect the account to
   */
  get application() {
    return this._data.application;
  }

  /**
   * Returns MetaTrader magic to place trades using
   * @return {Number} MetaTrader magic to place trades using
   */
  get magic() {
    return this._data.magic;
  }

  /**
   * Returns account deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED, DELETING
   * @return {String} account deployment state
   */
  get state() {
    return this._data.state;
  }

  /**
   * Returns terminal & broker connection status, one of CONNECTED, DISCONNECTED, DISCONNECTED_FROM_BROKER
   * @return {String} terminal & broker connection status
   */
  get connectionStatus() {
    return this._data.connectionStatus;
  }

  /**
   * Returns authorization access token to be used for accessing single account data.
   * Intended to be used in browser API.
   * @return {String} authorization token
   */
  get accessToken() {
    return this._data.accessToken;
  }

  /**
   * Returns flag indicating if trades should be placed as manual trades on this account
   * @return {Boolean} flag indicating if trades should be placed as manual trades on this account
   */
  get manualTrades() {
    return !!this._data.manualTrades;
  }

  /**
   * Returns extra information which can be stored together with your account
   * @return {Object} extra information which can be stored together with your account
   */
  get metadata() {
    return this._data.metadata;
  }

  /**
   * Returns user-defined account tags
   * @return {Array<string>} user-defined account tags
   */
  get tags() {
    return this._data.tags;
  }

  /**
   * Returns account roles for CopyFactory2 application
   * @return {Array<string>} account roles for CopyFactory2 application
   */
  get copyFactoryRoles() {
    return this._data.copyFactoryRoles;
  }

  /**
   * Returns number of resource slots to allocate to account. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CooyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   * @return {number} number of resource slots to allocate to account
   */
  get resourceSlots() {
    return this._data.resourceSlots;
  }

  /**
   * Returns the number of CopyFactory 2 resource slots to allocate to account.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @return {number} number of CopyFactory 2 resource slots to allocate to account
   */
  get copyFactoryResourceSlots() {
    return this._data.copyFactoryResourceSlots;
  }

  /**
   * Returns 3-character ISO currency code of the account base currency. Default value is USD. The setting is to be used
   * for copy trading accounts which use national currencies only, such as some Brazilian brokers. You should not alter
   * this setting unless you understand what you are doing.
   * @return {number} 3-character ISO currency code of the account base currency
   */
  get baseCurrency() {
    return this._data.baseCurrency;
  }

  /**
   * Returns reliability value. Possible values are regular and high
   * @return {String} account reliability value
   */
  get reliability() {
    return this._data.reliability;
  }

  /**
   * Returns version value. Possible values are 4 and 5
   * @return {String} account version value
   */
  get version() {
    return this._data.version;
  }

  /**
   * Returns account region
   * @return {String} account region value
   */
  get region() {
    return this._data.region;
  }

  /**
   * Returns active account connections
   * @return {Array<AccountConnection>} active account connections
   */
  get connections() {
    return this._data.connections;
  }

  /**
   * Returns flag indicating that risk management API is enabled on account. Default is false.
   * @return {boolean} flag indicating that risk management API is enabled on account
   */
  get riskManagementApiEnabled() {
    return this._data.riskManagementApiEnabled;
  }

  /**
   * Returns user id
   * @return {String} user id
   */
  get userId() {
    return this._data.userId;
  }

  /**
   * Returns account replica instances
   * @return {MetatraderAccountReplica[]} account replica instances
   */
  get replicas() {
    return this._replicas;
  }

  /**
   * Returns a dictionary with account's available regions and replicas
   * @returns {[id: string]: string}
   */
  get accountRegions() {
    const regions = {[this.region]: this.id};
    this.replicas.forEach(replica => regions[replica.region] = replica.id);
    return regions;
  }

  /**
   * Reloads MetaTrader account from API
   * @return {Promise} promise resolving when MetaTrader account is updated
   */
  async reload() {
    this._data = await this._metatraderAccountClient.getAccount(this.id);
    const updatedReplicaData = (this._data.accountReplicas || []);
    const regions = updatedReplicaData.map(replica => replica.region);
    const createdReplicaRegions = this._replicas.map(replica => replica.region);
    this._replicas = this._replicas.filter(replica => regions.includes(replica.region));
    this._replicas.forEach(replica => {
      const updatedData = updatedReplicaData.find(replicaData => replicaData._id === replica.id);
      replica.updateData(updatedData);
    });
    updatedReplicaData.forEach(replica => {
      if(!createdReplicaRegions.includes(replica.region)) {
        this._replicas.push(new MetatraderAccountReplica(replica, this, this._metatraderAccountClient));
      }
    });
  }

  /**
   * Removes MetaTrader account. Cloud account transitions to DELETING state. 
   * It takes some time for an account to be eventually deleted. Self-hosted 
   * account is deleted immediately.
   * @return {Promise} promise resolving when account is scheduled for deletion
   */
  async remove() {
    this._connectionRegistry.remove(this.id);
    await this._metatraderAccountClient.deleteAccount(this.id);
    const fileManager = HistoryDatabase.getInstance();
    await fileManager.clear(this.id, this._application);
    if (this.type !== 'self-hosted') {
      try {
        await this.reload();
      } catch (err) {
        if (err.name !== 'NotFoundError') {
          throw err;
        }
      }
    }
  }

  /**
   * Schedules account for deployment. It takes some time for API server to be started and account to reach the DEPLOYED
   * state
   * @returns {Promise} promise resolving when account is scheduled for deployment
   */
  async deploy() {
    await this._metatraderAccountClient.deployAccount(this.id);
    await this.reload();
  }

  /**
   * Schedules account for undeployment. It takes some time for API server to be stopped and account to reach the
   * UNDEPLOYED state
   * @returns {Promise} promise resolving when account is scheduled for undeployment
   */
  async undeploy() {
    this._connectionRegistry.remove(this.id);
    await this._metatraderAccountClient.undeployAccount(this.id);
    await this.reload();
  }

  /**
   * Schedules account for redeployment. It takes some time for API server to be restarted and account to reach the
   * DEPLOYED state
   * @returns {Promise} promise resolving when account is scheduled for redeployment
   */
  async redeploy() {
    await this._metatraderAccountClient.redeployAccount(this.id);
    await this.reload();
  }

  /**
   * Increases MetaTrader account reliability. The account will be temporary stopped to perform this action
   * @returns {Promise} promise resolving when account reliability is increased
   */
  async increaseReliability() {
    await this._metatraderAccountClient.increaseReliability(this.id);
    await this.reload();
  }

  /**
   * Waits until API server has finished deployment and account reached the DEPLOYED state
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deployed
   * @throws {TimeoutError} if account have not reached the DEPLOYED state within timeout allowed
   */
  async waitDeployed(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this.reload();
    while (this.state !== 'DEPLOYED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this.reload();
    }
    if (this.state !== 'DEPLOYED') {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be deployed');
    }
  }

  /**
   * Waits until API server has finished undeployment and account reached the UNDEPLOYED state
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deployed
   * @throws {TimeoutError} if account have not reached the UNDEPLOYED state within timeout allowed
   */
  async waitUndeployed(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this.reload();
    while (this.state !== 'UNDEPLOYED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this.reload();
    }
    if (this.state !== 'UNDEPLOYED') {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be undeployed');
    }
  }

  /**
   * Waits until account has been deleted
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account is deleted
   * @throws {TimeoutError} if account was not deleted within timeout allowed
   */
  async waitRemoved(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    try {
      await this.reload();
      while (startTime + timeoutInSeconds * 1000 > Date.now()) {
        await this._delay(intervalInMilliseconds);
        await this.reload();
      }
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be deleted');
    } catch (err) {
      if (err.name === 'NotFoundError') {
        return;
      } else {
        throw err;
      }
    }
  }

  /**
   * Waits until API server has connected to the terminal and terminal has connected to the broker
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when API server is connected to the broker
   * @throws {TimeoutError} if account have not connected to the broker within timeout allowed
   */
  async waitConnected(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    const checkConnected = () => {
      return [this.connectionStatus].concat(this.replicas.map(replica => 
        replica.connectionStatus)).includes('CONNECTED');
    };

    let startTime = Date.now();
    await this.reload();
    while (!checkConnected() && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this.reload();
    }
    if (!checkConnected()) {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to connect to the broker');
    }
  }

  /**
   * Connects to MetaApi. There is only one connection per account. Subsequent calls to this method will return the same connection.
   * @param {HistoryStorage} historyStorage optional history storage
   * @param {Date} [historyStartTime] history start time. Used for tests
   * @return {StreamingMetaApiConnection} MetaApi connection
   */
  getStreamingConnection(historyStorage, historyStartTime) {
    if(this._metaApiWebsocketClient.region && this._metaApiWebsocketClient.region !== this.region) {
      throw new ValidationError(
        `Account ${this.id} is not on specified region ${this._metaApiWebsocketClient.region}`
      );
    }
    return this._connectionRegistry.connect(this, historyStorage, historyStartTime);
  }

  /**
   * Connects to MetaApi via RPC connection.
   * @returns {RpcMetaApiConnection} MetaApi connection
   */
  getRPCConnection() {
    if(this._metaApiWebsocketClient.region && this._metaApiWebsocketClient.region !== this.region) {
      throw new ValidationError(
        `Account ${this.id} is not on specified region ${this._metaApiWebsocketClient.region}`
      );
    }
    return new RpcMetaApiConnection(this._metaApiWebsocketClient, this);
  }

  /**
   * Updates MetaTrader account data
   * @param {MetatraderAccountUpdateDto} account MetaTrader account update
   * @return {Promise} promise resolving when account is updated
   */
  async update(account) {
    await this._metatraderAccountClient.updateAccount(this.id, account);
    await this.reload();
  }

  /**
   * Creates a MetaTrader account replica
   * @param {NewMetatraderAccountDto} replica MetaTrader account replica data
   * @return {Promise<MetatraderAccountReplica>} promise resolving with MetaTrader account replica entity
   */
  async createReplica(replica) {
    await this._metatraderAccountClient.createAccountReplica(this.id, replica);
    await this.reload();
    return this._replicas.find(r => r.region === replica.region);
  }

  /**
   * Retrieves expert advisor of current account
   * @returns {Promise<ExpertAdvisor[]>} promise resolving with an array of expert advisor entities
   */
  async getExpertAdvisors() {
    this._checkExpertAdvisorAllowed();
    let expertAdvisors = await this._expertAdvisorClient.getExpertAdvisors(this.id);
    return expertAdvisors.map(e => new ExpertAdvisor(e, this.id, this._expertAdvisorClient));
  }

  /**
   * Retrieves a expert advisor of current account by id
   * @param {String} expertId expert advisor id
   * @returns {Promise<ExpertAdvisor>} promise resolving with expert advisor entity
   */
  async getExpertAdvisor(expertId) {
    this._checkExpertAdvisorAllowed();
    let expertAdvisor = await this._expertAdvisorClient.getExpertAdvisor(this.id, expertId);
    return new ExpertAdvisor(expertAdvisor, this.id, this._expertAdvisorClient);
  }

  /**
   * Creates an expert advisor
   * @param {String} expertId expert advisor id
   * @param {NewExpertAdvisorDto} expert expert advisor data
   * @returns {Promise<ExpertAdvisor>} promise resolving with expert advisor entity
   */
  async createExpertAdvisor(expertId, expert) {
    this._checkExpertAdvisorAllowed();
    await this._expertAdvisorClient.updateExpertAdvisor(this.id, expertId, expert);
    return this.getExpertAdvisor(expertId);
  }

  /**
   * Returns historical candles for a specific symbol and timeframe from the MetaTrader account.
   * See https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalCandles/
   * @param {string} symbol symbol to retrieve candles for (e.g. a currency pair or an index)
   * @param {string} timeframe defines the timeframe according to which the candles must be generated. Allowed values
   * for MT5 are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h, 1d, 1w, 1mn. Allowed
   * values for MT4 are 1m, 5m, 15m 30m, 1h, 4h, 1d, 1w, 1mn
   * @param {Date} [startTime] time to start loading candles from. Note that candles are loaded in backwards direction, so
   * this should be the latest time. Leave empty to request latest candles.
   * @param {number} [limit] maximum number of candles to retrieve. Must be less or equal to 1000
   * @return {Promise<Array<MetatraderCandle>>} promise resolving with historical candles downloaded
   */
  getHistoricalCandles(symbol, timeframe, startTime, limit) {
    return this._historicalMarketDataClient.getHistoricalCandles(this.id, this.region, symbol,
      timeframe, startTime, limit);
  }
  
  /**
   * Returns historical ticks for a specific symbol from the MetaTrader account. This API is not supported by MT4
   * accounts.
   * See https://metaapi.cloud/docs/client/restApi/api/retrieveMarketData/readHistoricalTicks/
   * @param {string} symbol symbol to retrieve ticks for (e.g. a currency pair or an index)
   * @param {Date} [startTime] time to start loading ticks from. Note that candles are loaded in forward direction, so
   * this should be the earliest time. Leave empty to request latest candles.
   * @param {number} [offset] number of ticks to skip (you can use it to avoid requesting ticks from previous request
   * twice)
   * @param {number} [limit] maximum number of ticks to retrieve. Must be less or equal to 1000
   * @return {Promise<Array<MetatraderTick>>} promise resolving with historical ticks downloaded
   */
  getHistoricalTicks(symbol, startTime, offset, limit) {
    return this._historicalMarketDataClient.getHistoricalTicks(this.id, this.region, symbol, startTime, offset, limit);
  }

  _checkExpertAdvisorAllowed() {
    if (this.version !== 4 || this.type !== 'cloud-g1') {
      throw new ValidationError('Custom expert advisor is available only for MT4 G1 accounts');
    }
  }

  _delay(timeoutInMilliseconds) {
    return new Promise(res => setTimeout(res, timeoutInMilliseconds));
  }

}
