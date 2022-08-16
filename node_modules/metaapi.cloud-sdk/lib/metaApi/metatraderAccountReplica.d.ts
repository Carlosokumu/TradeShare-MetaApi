import MetatraderAccountClient, { MetatraderAccountReplica, MetatraderAccountReplicaDto, MetatraderAccountReplicaUpdateDto } from "../clients/metaApi/metatraderAccount.client";
import MetatraderAccount from "./metatraderAccount";

/**
 * Implements a MetaTrader account entity
 */
export default class MetatraderAccountReplica {
  
  /**
   * Constructs a MetaTrader account entity
   * @param {MetatraderAccountReplicaDto} data MetaTrader account data
   * @param {MetatraderAccount} primaryAccount primary MetaTrader account
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   */
  constructor(data: MetatraderAccountReplicaDto, primaryAccount: MetatraderAccount, metatraderAccountClient: MetatraderAccountClient);
  
  /**
   * Returns account replica id
   * @return {string} account replica id
   */
  get id(): string;

  /**
   * Returns MetaTrader magic to place trades using
   * @return {number} MetaTrader magic to place trades using
   */
  get magic(): number;
  
  /**
   * Returns account replica deployment state. One of CREATED, DEPLOYING, DEPLOYED, UNDEPLOYING, UNDEPLOYED, DELETING
   * @return {string} account replica deployment state
   */
  get state(): string;

  /**
   * Returns terminal & broker connection status, one of CONNECTED, DISCONNECTED, DISCONNECTED_FROM_BROKER
   * @return {string} terminal & broker connection status
   */
  get connectionStatus(): string;
  
  /**
   * Returns extra information which can be stored together with your account replica
   * @return {Object} extra information which can be stored together with your account replica
   */
  get metadata(): Object;
  
  /**
   * Returns user-defined account replica tags
   * @return {Array<string>} user-defined account replica tags
   */
  get tags(): Array<string>;

  /**
   * Returns number of resource slots to allocate to account replica. Allocating extra resource slots
   * results in better account performance under load which is useful for some applications. E.g. if you have many
   * accounts copying the same strategy via CopyFactory API, then you can increase resourceSlots to get a lower trade
   * copying latency. Please note that allocating extra resource slots is a paid option. Please note that high
   * reliability accounts use redundant infrastructure, so that each resource slot for a high reliability account
   * is billed as 2 standard resource slots.  Default is 1.
   * @return {number} number of resource slots to allocate to account replica
   */
  get resourceSlots(): number;

  /**
   * Returns the number of CopyFactory 2 resource slots to allocate to account replica.
   * Allocating extra resource slots results in lower trade copying latency. Please note that allocating extra resource
   * slots is a paid option. Please also note that CopyFactory 2 uses redundant infrastructure so that
   * each CopyFactory resource slot is billed as 2 standard resource slots. You will be billed for CopyFactory 2
   * resource slots only if you have added your account replica to CopyFactory 2 by specifying copyFactoryRoles field.
   * Default is 1.
   * @return {number} number of CopyFactory 2 resource slots to allocate to account replica
   */
  get copyFactoryResourceSlots(): number;
  
  /**
   * Returns reliability value. Possible values are regular and high
   * @return {string} account replica reliability value
   */
  get reliability(): string;

  /**
   * Returns account replica region
   * @return {string} account replica region value
   */
  get region(): string;

  /**
   * Returns primary MetaTrader account of the replica
   * @return {MetatraderAccount} primary MetaTrader account of the replica
   */
  get primaryAccount(): MetatraderAccount;

  /**
   * Updates replica data
   * @param {MetatraderAccountReplicaDto} data MetaTrader account replica data 
   */
  updateData(data: MetatraderAccountReplicaDto): void;

  /**
   * Removes MetaTrader account replica. Cloud account transitions to DELETING state. 
   * It takes some time for an account to be eventually deleted. Self-hosted 
   * account is deleted immediately.
   * @return {Promise} promise resolving when account replica is scheduled for deletion
   */
  remove(): Promise<any>;

  /**
   * Schedules account replica for deployment. It takes some time for API server to be started and account replica to reach the DEPLOYED
   * state
   * @returns {Promise} promise resolving when account replica is scheduled for deployment
   */
  deploy(): Promise<any>;
  
  /**
   * Schedules account replica for undeployment. It takes some time for API server to be stopped and account replica to reach the
   * UNDEPLOYED state
   * @returns {Promise} promise resolving when account replica is scheduled for undeployment
   */
  undeploy(): Promise<any>;
  
  /**
   * Schedules account replica for redeployment. It takes some time for API server to be restarted and account replica to reach the
   * DEPLOYED state
   * @returns {Promise} promise resolving when account replica is scheduled for redeployment
   */
  redeploy(): Promise<any>;
  
  /**
   * Increases MetaTrader account replica reliability. The account replica will be temporary stopped to perform this action
   * @returns {Promise} promise resolving when account replica reliability is increased
   */
  increaseReliability(): Promise<any>;
  
   /**
   * Waits until API server has finished deployment and account replica reached the DEPLOYED state
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account replica is deployed
   */
  waitDeployed(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Waits until API server has finished undeployment and account replica reached the UNDEPLOYED state
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account replica is deployed
   */
  waitUndeployed(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Waits until account replica has been deleted
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when account replica is deleted
   */
  waitRemoved(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Waits until API server has connected to the terminal and terminal has connected to the broker
   * @param {number} timeoutInSeconds wait timeout in seconds, default is 5m
   * @param {number} intervalInMilliseconds interval between account replica reloads while waiting for a change, default is 1s
   * @return {Promise} promise which resolves when API server is connected to the broker
   */
  waitConnected(timeoutInSeconds?: number, intervalInMilliseconds?: number): Promise<any>;
  
  /**
   * Updates MetaTrader account replica data
   * @param {MetatraderAccountReplicaUpdateDto} account MetaTrader account update
   * @return {Promise} promise resolving when account replica is updated
   */
  update(account: MetatraderAccountReplicaUpdateDto): Promise<any>;
}
