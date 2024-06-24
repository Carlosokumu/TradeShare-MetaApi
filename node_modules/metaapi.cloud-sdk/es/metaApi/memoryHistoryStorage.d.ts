import { MetatraderDeal, MetatraderOrder } from "../clients/metaApi/metaApiWebsocket.client";
import HistoryStorage from "./historyStorage";

/**
 * History storage which stores MetaTrader history in RAM
 */
export default class MemoryHistoryStorage extends HistoryStorage {

  /**
   * Constructs the in-memory history store instance
   */
  constructor();

  /**
   * Initializes the storage and loads required data from a persistent storage
   * @param {string} accountId account id
   * @param {string} application application
   * @returns {Promise} promise resolving when history storage is initialized
   */
  initialize(accountId: string, application: string): Promise<any>;

  /**
   * Returns flag indicating whether order history synchronization have finished
   * @return {boolean} flag indicating whether order history synchronization have finished
   */
  get orderSynchronizationFinished(): boolean;

  /**
   * Returns flag indicating whether deal history synchronization have finished
   * @return {boolean} flag indicating whether deal history synchronization have finished
   */
  get dealSynchronizationFinished(): boolean;

  /**
   * Clears the storage and deletes persistent data
   * @returns {Promise} promise resolving when history storage is cleared
   */
  clear(): Promise<any>;

  /**
   * Returns the time of the last history order record stored in the history storage
   * @param {number} [instanceIndex] index of an account instance connected
   * @returns {Promise<Date>} the time of the last history order record stored in the history storage
   */
  lastHistoryOrderTime(instanceIndex?: number): Promise<Date>;

  /**
   * Returns the time of the last history deal record stored in the history storage
   * @param {number} [instanceIndex] index of an account instance connected
   * @returns {Promise<Date>} the time of the last history deal record stored in the history storage
   */
  lastDealTime(instanceIndex?: number): Promise<Date>;

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrderAdded(instanceIndex: string, historyOrder: MetatraderOrder): Promise<any>;

  /**
   * Invoked when a new MetaTrader history deal is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderDeal} deal new MetaTrader history deal
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealAdded(instanceIndex: string, deal: MetatraderDeal): Promise<any>;

  /**
   * Invoked when a synchronization of history deals on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onDealsSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;

  /**
   * Invoked when a synchronization of history orders on a MetaTrader account have finished to indicate progress of an
   * initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onHistoryOrdersSynchronized(instanceIndex: string, synchronizationId: string): Promise<any>;

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {string} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex: string): Promise<any>;

  /**
   * Returns all deals stored in history storage
   * @return {Array<MetatraderDeal>} all deals stored in history storage
   */
  get deals(): Array<MetatraderDeal>;

  /**
   * Returns deals by ticket id
   * @param {string} id ticket id
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByTicket(id): Array<MetatraderDeal>;

  /**
   * Returns deals by position id
   * @param {string} positionId position id
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByPosition(positionId): Array<MetatraderDeal>;

  /**
   * Returns deals by time range
   * @param startTime start time, inclusive
   * @param endTime end time, inclusive
   * @returns {Array<MetatraderDeal>} deals found
   */
  getDealsByTimeRange(startTime, endTime): Array<MetatraderDeal>;

  /**
   * Returns all history orders stored in history storage
   * @return {Array<MetatraderOrder>} all history orders stored in history storage
   */
  get historyOrders(): Array<MetatraderOrder>

  /**
   * Returns history orders by ticket id
   * @param {string} id ticket id
   * @returns {Array<MetatraderOrder>} history orders found
   */
  getHistoryOrdersByTicket(id): Array<MetatraderOrder>;

  /**
   * Returns history orders by position id
   * @param {string} positionId position id
   * @returns {Array<MetatraderOrder>} history orders found
   */
  getHistoryOrdersByPosition(positionId): Array<MetatraderOrder>;

  /**
   * Returns history orders by time range
   * @param startTime start time, inclusive
   * @param endTime end time, inclusive
   * @returns {Array<MetatraderOrder>} hisotry orders found
   */
  getHistoryOrdersByTimeRange(startTime, endTime): Array<MetatraderOrder>;

}