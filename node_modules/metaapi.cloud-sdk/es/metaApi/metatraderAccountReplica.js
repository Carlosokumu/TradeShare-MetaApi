import TimeoutError from '../clients/timeoutError';

/**
 * Implements a MetaTrader account replica entity
 */
export default class MetatraderAccountReplica {

  /**
   * Constructs a MetaTrader account entity
   * @param {MetatraderAccountReplicaDto} data MetaTrader account replica data
   * @param {MetatraderAccount} primaryAccount primary MetaTrader account
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   */
  constructor(data, primaryAccount, metatraderAccountClient) {
    this._data = data;
    this._primaryAccount = primaryAccount;
    this._metatraderAccountClient = metatraderAccountClient;
  }

  /**
   * Returns account replica id
   * @return {String} account replica id
   */
  get id() {
    return this._data._id;
  }

  /**
   * Returns MetaTrader magic to place trades using
   * @return {Number} MetaTrader magic to place trades using
   */
  get magic() {
    return this._data.magic;
  }

  /**
   * Returns account replica deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED, DELETING
   * @return {String} account replica deployment state
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
   * Returns extra information which can be stored together with your account replica
   * @return {Object} extra information which can be stored together with your account replica
   */
  get metadata() {
    return this._data.metadata;
  }

  /**
   * Returns user-defined account replica tags
   * @return {Array<string>} user-defined account replica tags
   */
  get tags() {
    return this._data.tags;
  }

  /**
   * Returns number of resource slots to allocate to account replica. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CopyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   * @return {number} number of resource slots to allocate to account replica
   */
  get resourceSlots() {
    return this._data.resourceSlots;
  }

  /**
   * Returns the number of CopyFactory 2 resource slots to allocate to account replica.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account replica to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @return {number} number of CopyFactory 2 resource slots to allocate to account replica
   */
  get copyFactoryResourceSlots() {
    return this._data.copyFactoryResourceSlots;
  }

  /**
   * Returns reliability value. Possible values are regular and high
   * @return {string} account replica reliability value
   */
  get reliability() {
    return this._data.reliability;
  }

  /**
     * Returns account replica region
     * @return {string} account replica region value
     */
  get region() {
    return this._data.region;
  }

  /**
   * Returns primary MetaTrader account of the replica
   * @return {MetatraderAccount} primary MetaTrader account of the replica
   */
  get primaryAccount() {
    return this._primaryAccount;
  }

  /**
   * Updates replica data
   * @param {MetatraderAccountReplicaDto} data MetaTrader account replica data 
   */
  updateData(data) {
    this._data = data;
  }

  /**
   * Removes MetaTrader account replica. Cloud account transitions to DELETING state. 
   * It takes some time for an account to be eventually deleted. Self-hosted 
   * account is deleted immediately.
   * @return {Promise} promise resolving when account replica is scheduled for deletion
   */
  async remove() {
    await this._metatraderAccountClient.deleteAccountReplica(this.primaryAccount.id, this.id);
    try {
      await this._primaryAccount.reload();
    } catch (err) {
      if (err.name !== 'NotFoundError') {
        throw err;
      }
    }
  }

  /**
   * Schedules account replica for deployment. It takes some time for API server to be started and account replica to reach the DEPLOYED
   * state
   * @returns {Promise} promise resolving when account replica is scheduled for deployment
   */
  async deploy() {
    await this._metatraderAccountClient.deployAccountReplica(this.primaryAccount.id, this.id);
    await this._primaryAccount.reload();
  }

  /**
   * Schedules account replica for undeployment. It takes some time for API server to be stopped and account replica to reach the
   * UNDEPLOYED state
   * @returns {Promise} promise resolving when account replica is scheduled for undeployment
   */
  async undeploy() {
    await this._metatraderAccountClient.undeployAccountReplica(this.primaryAccount.id, this.id);
    await this._primaryAccount.reload();
  }

  /**
   * Schedules account replica for redeployment. It takes some time for API server to be restarted and account replica to reach the
   * DEPLOYED state
   * @returns {Promise} promise resolving when account replica is scheduled for redeployment
   */
  async redeploy() {
    await this._metatraderAccountClient.redeployAccountReplica(this.primaryAccount.id, this.id);
    await this._primaryAccount.reload();
  }

  /**
   * Increases MetaTrader account replica reliability. The account replica will be temporary stopped to perform this action
   * @returns {Promise} promise resolving when account replica reliability is increased
   */
  async increaseReliability() {
    await this._metatraderAccountClient.increaseReliability(this.id);
    await this._primaryAccount.reload();
  }

  /**
   * Waits until API server has finished deployment and account replica reached the DEPLOYED state
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account replica is deployed
   * @throws {TimeoutError} if account replica has not reached the DEPLOYED state within timeout allowed
   */
  async waitDeployed(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this._primaryAccount.reload();
    while (this.state !== 'DEPLOYED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this._primaryAccount.reload();
    }
    if (this.state !== 'DEPLOYED') {
      throw new TimeoutError('Timed out waiting for account replica ' + this.id + ' to be deployed');
    }
  }

  /**
   * Waits until API server has finished undeployment and account replica reached the UNDEPLOYED state
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account replica is deployed
   * @throws {TimeoutError} if account replica has not reached the UNDEPLOYED state within timeout allowed
   */
  async waitUndeployed(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this._primaryAccount.reload();
    while (this.state !== 'UNDEPLOYED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this._primaryAccount.reload();
    }
    if (this.state !== 'UNDEPLOYED') {
      throw new TimeoutError('Timed out waiting for account replica ' + this.id + ' to be undeployed');
    }
  }

  /**
   * Waits until account replica has been deleted
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account replica is deleted
   * @throws {TimeoutError} if account replica was not deleted within timeout allowed
   */
  async waitRemoved(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this._primaryAccount.reload();
    while (startTime + timeoutInSeconds * 1000 > Date.now() && 
        this._primaryAccount.accountRegions[this.region] === this.id) {
      await this._delay(intervalInMilliseconds);
      await this._primaryAccount.reload();
    }
    if(this._primaryAccount.accountRegions[this.region] === this.id) {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to be deleted');
    }
  }

  /**
   * Waits until API server has connected to the terminal and terminal has connected to the broker
   * @param {Number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {Number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when API server is connected to the broker
   * @throws {TimeoutError} if account replica has not connected to the broker within timeout allowed
   */
  async waitConnected(timeoutInSeconds = 300, intervalInMilliseconds = 1000) {
    let startTime = Date.now();
    await this._primaryAccount.reload();
    while (this.connectionStatus !== 'CONNECTED' && (startTime + timeoutInSeconds * 1000) > Date.now()) {
      await this._delay(intervalInMilliseconds);
      await this._primaryAccount.reload();
    }
    if (this.connectionStatus !== 'CONNECTED') {
      throw new TimeoutError('Timed out waiting for account ' + this.id + ' to connect to the broker');
    }
  }

  /**
   * Updates MetaTrader account replica data
   * @param {UpdatedMetatraderAccountReplicaDto} account MetaTrader account replica update
   * @return {Promise} promise resolving when account replica is updated
   */
  async update(account) {
    await this._metatraderAccountClient.updateAccountReplica(this._primaryAccount.id, this.id, account);
    await this._primaryAccount.reload();
  }

  _delay(timeoutInMilliseconds) {
    return new Promise(res => setTimeout(res, timeoutInMilliseconds));
  }

}
