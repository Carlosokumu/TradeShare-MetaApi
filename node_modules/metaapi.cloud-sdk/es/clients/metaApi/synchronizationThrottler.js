'use strict';

import TimeoutError from '../timeoutError';
import OptionsValidator from '../optionsValidator';
import LoggerManager from '../../logger';

/**
 * Options for synchronization throttler
 * @typedef {Object} SynchronizationThrottlerOpts
 * @property {Number} [maxConcurrentSynchronizations] amount of maximum allowed concurrent synchronizations
 * @property {Number} [queueTimeoutInSeconds] allowed time for a synchronization in queue
 * @property {Number} [synchronizationTimeoutInSeconds] time after which a synchronization slot
 * is freed to be used by another synchronization
 */

/**
 * Synchronization throttler used to limit the amount of concurrent synchronizations to prevent application
 * from being overloaded due to excessive number of synchronisation responses being sent.
 */
export default class SynchronizationThrottler {

  /**
   * Constructs the synchronization throttler
   * @param {MetaApiWebsocketClient} client MetaApi websocket client
   * @param {Number} socketInstanceIndex index of socket instance that uses the throttler
   * @param {Number} instanceNumber instance index number
   * @param {String} region server region
   * @param {SynchronizationThrottlerOpts} opts synchronization throttler options
   */
  constructor(client, socketInstanceIndex, instanceNumber, region, opts) {
    const validator = new OptionsValidator();
    opts = opts || {};
    this._maxConcurrentSynchronizations = validator.validateNonZero(opts.maxConcurrentSynchronizations, 15,
      'synchronizationThrottler.maxConcurrentSynchronizations');
    this._queueTimeoutInSeconds = validator.validateNonZero(opts.queueTimeoutInSeconds, 300,
      'synchronizationThrottler.queueTimeoutInSeconds');
    this._synchronizationTimeoutInSeconds = validator.validateNonZero(opts.synchronizationTimeoutInSeconds, 10,
      'synchronizationThrottler.synchronizationTimeoutInSeconds');
    this._client = client;
    this._region = region;
    this._socketInstanceIndex = socketInstanceIndex;
    this._synchronizationIds = {};
    this._accountsBySynchronizationIds = {};
    this._synchronizationQueue = [];
    this._removeOldSyncIdsInterval = null;
    this._processQueueInterval = null;
    this._instanceNumber = instanceNumber;
    this._logger = LoggerManager.getLogger('SynchronizationThrottler');
  }

  /**
   * Initializes the synchronization throttler
   */
  start() {
    if(!this._removeOldSyncIdsInterval) {
      this._removeOldSyncIdsInterval = setInterval(() => this._removeOldSyncIdsJob(), 1000);
      this._processQueueInterval = setInterval(() => this._processQueueJob(), 1000);
    }
  }

  /**
   * Deinitializes the throttler
   */
  stop() {
    clearInterval(this._removeOldSyncIdsInterval);
    this._removeOldSyncIdsInterval = null;
    clearInterval(this._processQueueInterval);
    this._processQueueInterval = null;
  }

  async _removeOldSyncIdsJob() {
    const now = Date.now();
    for (let key of Object.keys(this._synchronizationIds)) {
      if ((now - this._synchronizationIds[key]) > this._synchronizationTimeoutInSeconds * 1000) {
        delete this._synchronizationIds[key];
      }
    }
    while (this._synchronizationQueue.length && (Date.now() - this._synchronizationQueue[0].queueTime) > 
        this._queueTimeoutInSeconds * 1000) {
      this._removeFromQueue(this._synchronizationQueue[0].synchronizationId, 'timeout');
    }
    this._advanceQueue();
  }

  /**
   * Fills a synchronization slot with synchronization id
   * @param {String} synchronizationId synchronization id
   */
  updateSynchronizationId(synchronizationId) {
    if(this._accountsBySynchronizationIds[synchronizationId]) {
      this._synchronizationIds[synchronizationId] = Date.now();
    }
  }

  /**
   * Returns the list of currently synchronizing account ids
   */
  get synchronizingAccounts() {
    const synchronizingAccounts = [];
    Object.keys(this._synchronizationIds).forEach(key => {
      const accountData = this._accountsBySynchronizationIds[key];
      if(accountData && !synchronizingAccounts.includes(accountData.accountId)) {
        synchronizingAccounts.push(accountData.accountId);
      }
    });
    return synchronizingAccounts;
  }

  /**
   * Returns the list of currenly active synchronization ids
   * @return {String[]} synchronization ids
   */
  get activeSynchronizationIds() {
    return Object.keys(this._accountsBySynchronizationIds);
  }

  /**
   * Returns the amount of maximum allowed concurrent synchronizations
   * @return {number} maximum allowed concurrent synchronizations
   */
  get maxConcurrentSynchronizations() {
    const calculatedMax = Math.max(Math.ceil(
      this._client.subscribedAccountIds(this._instanceNumber, this._socketInstanceIndex, this._region).length / 10), 1);
    return Math.min(calculatedMax, this._maxConcurrentSynchronizations);
  }

  /**
   * Returns flag whether there are free slots for synchronization requests
   * @return {Boolean} flag whether there are free slots for synchronization requests
   */
  get isSynchronizationAvailable() {
    if (this._client.socketInstances[this._region][this._instanceNumber].reduce((acc, socketInstance) => 
      acc + socketInstance.synchronizationThrottler.synchronizingAccounts.length, 0) >=
      this._maxConcurrentSynchronizations) {
      return false;
    }
    return this.synchronizingAccounts.length < this.maxConcurrentSynchronizations;
  }

  /**
   * Removes synchronizations from queue and from the list by parameters
   * @param {String} accountId account id
   * @param {Number} instanceIndex account instance index
   * @param {String} host account host name
   */
  removeIdByParameters(accountId, instanceIndex, host) {
    for (let key of Object.keys(this._accountsBySynchronizationIds)) {
      if(this._accountsBySynchronizationIds[key].accountId === accountId &&
          this._accountsBySynchronizationIds[key].instanceIndex === instanceIndex &&
          this._accountsBySynchronizationIds[key].host === host) {
        this.removeSynchronizationId(key);
      }
    }
  }

  /**
   * Removes synchronization id from slots and removes ids for the same account from the queue
   * @param {String} synchronizationId synchronization id
   */
  removeSynchronizationId(synchronizationId) {
    if (this._accountsBySynchronizationIds[synchronizationId]) {
      const accountId = this._accountsBySynchronizationIds[synchronizationId].accountId;
      const instanceIndex = this._accountsBySynchronizationIds[synchronizationId].instanceIndex;
      const host = this._accountsBySynchronizationIds[synchronizationId].host;
      for (let key of Object.keys(this._accountsBySynchronizationIds)) {
        if(this._accountsBySynchronizationIds[key].accountId === accountId && 
          this._accountsBySynchronizationIds[key].instanceIndex === instanceIndex &&
          this._accountsBySynchronizationIds[key].host === host) {
          this._removeFromQueue(key, 'cancel');
          delete this._accountsBySynchronizationIds[key];
        }
      }
    }
    if(this._synchronizationIds[synchronizationId]) {
      delete this._synchronizationIds[synchronizationId];
    }
    this._advanceQueue();
  }

  /**
   * Clears synchronization ids on disconnect
   */
  onDisconnect() {
    this._synchronizationQueue.forEach(synchronization => {
      synchronization.resolve('cancel');
    });
    this._synchronizationIds = {};
    this._accountsBySynchronizationIds = {};
    this._synchronizationQueue = [];
    this.stop();
    this.start();
  }

  _advanceQueue() {
    let index = 0;
    while(this.isSynchronizationAvailable && this._synchronizationQueue.length && 
        index < this._synchronizationQueue.length) {
      const queueItem = this._synchronizationQueue[index];
      queueItem.resolve('synchronize');
      this.updateSynchronizationId(queueItem.synchronizationId);
      index++;
    }
  }

  _removeFromQueue(synchronizationId, result) {
    this._synchronizationQueue.forEach((syncItem, i) => {
      if(syncItem.synchronizationId === synchronizationId) {
        syncItem.resolve(result);
      }
    });
    this._synchronizationQueue = this._synchronizationQueue.filter(item => 
      item.synchronizationId !== synchronizationId);
  }

  async _processQueueJob() {
    try {
      while (this._synchronizationQueue.length) {
        const queueItem = this._synchronizationQueue[0];
        await this._synchronizationQueue[0].promise;
        if(this._synchronizationQueue.length && this._synchronizationQueue[0].synchronizationId === 
            queueItem.synchronizationId) {
          this._synchronizationQueue.shift();
        }
      }
    } catch (err) {
      this._logger.error('Error processing queue job', err);
    }
  }

  /**
   * Schedules to send a synchronization request for account
   * @param {String} accountId account id
   * @param {Object} request request to send
   * @param {Function} getHashes function to get terminal state hashes
   */
  async scheduleSynchronize(accountId, request, getHashes) {
    const synchronizationId = request.requestId;
    for (let key of Object.keys(this._accountsBySynchronizationIds)) {
      if(this._accountsBySynchronizationIds[key].accountId === accountId &&
        this._accountsBySynchronizationIds[key].instanceIndex === request.instanceIndex &&
        this._accountsBySynchronizationIds[key].host === request.host) {
        this.removeSynchronizationId(key);
      }
    }
    this._accountsBySynchronizationIds[synchronizationId] = {accountId, instanceIndex: request.instanceIndex,
      host: request.host};
    if(!this.isSynchronizationAvailable) {
      let resolve;
      let requestResolve = new Promise((res) => {
        resolve = res;
      });
      this._synchronizationQueue.push({
        synchronizationId: synchronizationId,
        promise: requestResolve,
        resolve,
        queueTime: Date.now()
      });
      const result = await requestResolve;
      if(result === 'cancel') {
        return false;
      } else if(result === 'timeout') {
        throw new TimeoutError(`Account ${accountId} synchronization ${synchronizationId}` +
        ' timed out in synchronization queue');
      }
    }
    this.updateSynchronizationId(synchronizationId);
    const hashes = await getHashes();
    request.specificationsMd5 = hashes.specificationsMd5;
    request.positionsMd5 = hashes.positionsMd5;
    request.ordersMd5 = hashes.ordersMd5;
    await this._client.rpcRequest(accountId, request);
    return true;
  }

}