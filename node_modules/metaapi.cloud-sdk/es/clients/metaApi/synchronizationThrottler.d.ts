import MetaApiWebsocketClient from "./metaApiWebsocket.client";

/**
 * Synchronization throttler used to limit the amount of concurrent synchronizations to prevent application
 * from being overloaded due to excessive number of synchronisation responses being sent.
 */
export default class SynchronizationThrottler {
  
  /**
   * Constructs the synchronization throttler
   * @param {MetaApiWebsocketClient} client MetaApi websocket client
   * @param {number} socketInstanceIndex index of socket instance that uses the throttler
   * @param {number} instanceNumber instance index number
   * @param {string} region server region
   * @param {SynchronizationThrottlerOpts} opts synchronization throttler options
   */
  constructor(client: MetaApiWebsocketClient, socketInstanceIndex: number, instanceNumber: number, region: string, opts: SynchronizationThrottlerOpts);
  
  /**
   * Initializes the synchronization throttler
   */
  start(): void;
  
  /**
   * Deinitializes the throttler
   */
  stop(): void;
  
  /**
   * Fills a synchronization slot with synchronization id
   * @param {string} synchronizationId synchronization id
   */
  updateSynchronizationId(synchronizationId: string): void;
  
  /**
   * Returns the list of currently synchronizing account ids
   */
  get synchronizingAccounts(): string[];
  
  /**
   * Returns the list of currenly active synchronization ids
   * @return {string[]} synchronization ids
   */
  get activeSynchronizationIds(): string[];
  
  /**
   * Returns the amount of maximum allowed concurrent synchronizations
   * @return {number} maximum allowed concurrent synchronizations
   */
  get maxConcurrentSynchronizations(): number;
  
  /**
   * Returns flag whether there are free slots for synchronization requests
   * @return {boolean} flag whether there are free slots for synchronization requests
   */
  get isSynchronizationAvailable(): boolean;
  
  /**
   * Removes synchronizations from queue and from the list by parameters
   * @param {string} accountId account id
   * @param {number} instanceIndex account instance index
   * @param {string} host account host name
   */
  removeIdByParameters(accountId: string, instanceIndex: number, host: string): void;
  
  /**
   * Removes synchronization id from slots and removes ids for the same account from the queue
   * @param {string} synchronizationId synchronization id
   */
  removeSynchronizationId(synchronizationId: string): void;
  
  /**
   * Clears synchronization ids on disconnect
   */
  onDisconnect(): void;
  
  /**
   * Schedules to send a synchronization request for account
   * @param {string} accountId account id
   * @param {Object} request request to send
   * @param {Function} getHashes function to get terminal state hashes
   */
  scheduleSynchronize(accountId: string, request: Object, getHashes: Function): Promise<boolean>;
}

/**
 * Options for synchronization throttler
 */
declare type SynchronizationThrottlerOpts = {

  /**
   * amount of maximum allowed concurrent synchronizations
   */
  maxConcurrentSynchronizations?: number,

  /**
   * allowed time for a synchronization in queue
   */
  queueTimeoutInSeconds?: number,

  /**
   * time after which a synchronization slot
   * is freed to be used by another synchronization
   */
  synchronizationTimeoutInSeconds?: number
}