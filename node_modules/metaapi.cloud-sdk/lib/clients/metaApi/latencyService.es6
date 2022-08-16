import socketIO from 'socket.io-client';
import LoggerManager from '../../logger';

/**
 * Service for managing account replicas based on region latency
 */
export default class LatencyService {

  /**
   * Constructs latency service instance
   * @param {MetaApiWebsocketClient} websocketClient MetaApi websocket client
   * @param {String} token authorization token
   * @param {Number} connectTimeout websocket connect timeout in seconds
   */
  constructor(websocketClient, token, connectTimeout) {
    this._websocketClient = websocketClient;
    this._token = token;
    this._connectTimeout = connectTimeout;
    this._latencyCache = {};
    this._connectedInstancesCache = {};
    this._synchronizedInstancesCache = {};
    this._refreshPromisesByRegion = {};
    this._logger = LoggerManager.getLogger('LatencyService');
    this._refreshRegionLatencyJob = this._refreshRegionLatencyJob.bind(this);
    setInterval(this._refreshRegionLatencyJob, 15 * 60 * 1000);
  }

  /**
   * Returns the list of regions sorted by latency
   * @returns {String[]} list of regions sorted by latency
   */
  get regionsSortedByLatency() {
    const regions = Object.keys(this._latencyCache);
    regions.sort((a, b) => this._latencyCache[a] - this._latencyCache[b]);
    return regions;
  }

  /**
   * Invoked when an instance has been disconnected
   * @param {String} instanceId instance id
   */
  onDisconnected(instanceId) {
    try {
      const accountId = this._getAccountIdFromInstance(instanceId);
      const disconnectedRegion = this._getRegionFromInstance(instanceId);
      this._disconnectInstance(instanceId);
      const instances = this._getAccountInstances(accountId);
      if(!instances.map(instance => this._connectedInstancesCache[instance]).includes(true)) {
        const regions = this._getAccountRegions(accountId);
        regions.filter(region => region !== disconnectedRegion)
          .forEach(region => this._subscribeAccountReplica(accountId, region));
      }
    } catch (err) {
      this._logger.error(`Failed to process onDisconnected event for instance ${instanceId}`, err);
    }
  }

  /**
   * Invoked when an account has been unsubscribed
   * @param {String} accountId account id
   */
  onUnsubscribe(accountId) {
    try {
      const region = this._websocketClient.getAccountRegion(accountId);
      const primaryAccountId = this._websocketClient.accountsByReplicaId[accountId];
      const instances = this._getAccountInstances(primaryAccountId);
      instances.filter(instanceId => instanceId.startsWith(`${primaryAccountId}:${region}:`))
        .forEach(instanceId => this._disconnectInstance(instanceId));
    } catch (err) {
      this._logger.error(`Failed to process onUnsubscribe event for account ${accountId}`, err);
    }
  }

  /**
   * Invoked when an instance has been connected
   * @param {String} instanceId instance id
   */
  async onConnected(instanceId) {
    try {
      this._connectedInstancesCache[instanceId] = true;
      const accountId = this._getAccountIdFromInstance(instanceId);
      const region = this._getRegionFromInstance(instanceId);
      if(!this._latencyCache[region]) {
        await this._refreshLatency(region);
      }
      const instances = this.getActiveAccountInstances(accountId);
      const synchronizedInstances = this.getSynchronizedAccountInstances(accountId);
      const regions = instances.map(instance => this._getRegionFromInstance(instance));
      if (instances.length > 1 && !synchronizedInstances.length) {
        const regionsToDisconnect = this.regionsSortedByLatency
          .filter(sortedRegion => regions.includes(sortedRegion)).slice(1);
        regionsToDisconnect.forEach(regionItem => {
          this._websocketClient.unsubscribe(this._websocketClient.accountReplicas[accountId][regionItem]);
          this._websocketClient.unsubscribeAccountRegion(accountId, regionItem);
        });
      }
    } catch (err) {
      this._logger.error(`Failed to process onConnected event for instance ${instanceId}`, err);
    }
  }

  /**
   * Invoked when an instance has been synchronized
   * @param {String} instanceId instance id
   */
  async onDealsSynchronized(instanceId) {
    try {
      this._synchronizedInstancesCache[instanceId] = true;
      const accountId = this._getAccountIdFromInstance(instanceId);
      const region = this._getRegionFromInstance(instanceId);
      if(!this._latencyCache[region]) {
        await this._refreshLatency(region);
      }
      const instances = this.getSynchronizedAccountInstances(accountId);
      const regions = instances.map(instance => this._getRegionFromInstance(instance));
      if (instances.length > 1) {
        const regionsToDisconnect = this.regionsSortedByLatency
          .filter(sortedRegion => regions.includes(sortedRegion)).slice(1);
        regionsToDisconnect.forEach(regionItem => {
          this._websocketClient.unsubscribe(this._websocketClient.accountReplicas[accountId][regionItem]);
          this._websocketClient.unsubscribeAccountRegion(accountId, regionItem);
        });
      }
    } catch (err) {
      this._logger.error(`Failed to process onDealsSynchronized event for instance ${instanceId}`, err);
    }
  }

  /**
   * Returns the list of currently connected account instances
   * @param {String} accountId account id
   * @returns {String[]} list of connected account instances
   */
  getActiveAccountInstances(accountId) {
    return this._getAccountInstances(accountId).filter(instance => this._connectedInstancesCache[instance]);
  }

  /**
   * Returns the list of currently synchronized account instances
   * @param {String} accountId account id
   * @returns {String[]} list of synchronized account instances
   */
  getSynchronizedAccountInstances(accountId) {
    return this._getAccountInstances(accountId).filter(instance => this._synchronizedInstancesCache[instance]);
  }

  _getAccountInstances(accountId) {
    return Object.keys(this._connectedInstancesCache).filter(instanceId => instanceId.startsWith(`${accountId}:`));
  }

  _getAccountRegions(accountId) {
    const regions = [];
    const instances = this._getAccountInstances(accountId);
    instances.forEach(instance => {
      const region = this._getRegionFromInstance(instance);
      if(!regions.includes(region)) {
        regions.push(region);
      }
    });
    return regions;
  }

  _getAccountIdFromInstance(instanceId) {
    return instanceId.split(':')[0];
  }

  _getRegionFromInstance(instanceId) {
    return instanceId.split(':')[1];
  }

  _disconnectInstance(instanceId) {
    this._connectedInstancesCache[instanceId] = false;
    if(this._synchronizedInstancesCache[instanceId]) {
      this._synchronizedInstancesCache[instanceId] = false;
    }
  }

  _subscribeAccountReplica(accountId, region) {
    this._websocketClient.ensureSubscribe(this._websocketClient.accountReplicas[accountId][region], 0);
    this._websocketClient.ensureSubscribe(this._websocketClient.accountReplicas[accountId][region], 1);
  }

  async _refreshRegionLatencyJob() {
    for(let region of Object.keys(this._latencyCache)) {
      await this._refreshLatency(region);
    }

    // For every account, switch to a better region if such exists
    const accountIds = [];
    Object.keys(this._connectedInstancesCache)
      .filter(instanceId => this._connectedInstancesCache[instanceId])
      .forEach(instanceId => {
        const accountId = this._getAccountIdFromInstance(instanceId);
        if(!accountIds.includes(accountId)) {
          accountIds.push(accountId);
        }
      });

    const sortedRegions = this.regionsSortedByLatency;

    accountIds.forEach(accountId => {
      const accountRegions = this._getAccountRegions(accountId);
      const activeInstances = this.getActiveAccountInstances(accountId);
      if(activeInstances.length === 1) {
        const activeInstance = activeInstances[0];
        const activeRegion = this._getRegionFromInstance(activeInstance);
        const accountBestRegions = sortedRegions.filter(region => accountRegions.includes(region));
        if(accountBestRegions[0] !== activeRegion) {
          this._subscribeAccountReplica(accountId, accountBestRegions[0]);
        }
      }
    });
  }

  async _refreshLatency(region) {
    if(this._refreshPromisesByRegion[region]) {
      return await this._refreshPromisesByRegion[region];
    }
    let resolve;
    this._refreshPromisesByRegion[region] = new Promise((res, rej) => {
      resolve = res;
    });
    const serverUrl = await this._websocketClient.getUrlSettings(0, region);
    const startDate = Date.now();
  
    const socketInstance = socketIO(serverUrl.url, {
      path: '/ws',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: this._connectTimeout,
      query: {
        'auth-token': this._token,
        protocol: 3
      }
    });
    socketInstance.on('connect', async () => {
      resolve();
      const latency = Date.now() - startDate;
      this._latencyCache[region] = latency;
      socketInstance.close();
    });
    await this._refreshPromisesByRegion[region];
    delete this._refreshPromisesByRegion[region];
  }

}
