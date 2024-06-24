'use strict';

import LoggerManager from '../../logger';

/**
 * Subscription manager to handle account subscription logic
 */
export default class SubscriptionManager {

  /**
   * Constructs the subscription manager
   * @param {MetaApiWebsocketClient} websocketClient websocket client to use for sending requests
   */
  constructor(websocketClient) {
    this._websocketClient = websocketClient;
    this._subscriptions = {};
    this._awaitingResubscribe = {};
    this._subscriptionState = {};
    this._logger = LoggerManager.getLogger('SubscriptionManager');
  }

  /**
   * Returns whether an account is currently subscribing
   * @param {String} accountId account id
   * @param {Number} instanceNumber instance index number
   * @returns {Boolean} whether an account is currently subscribing
   */
  isAccountSubscribing(accountId, instanceNumber) {
    if(instanceNumber !== undefined) {
      return Object.keys(this._subscriptions).includes(accountId + ':' + instanceNumber);
    } else {
      for (let key of Object.keys(this._subscriptions)) {
        if (key.startsWith(accountId)) {
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Returns whether an instance is in disconnected retry mode
   * @param {String} accountId account id
   * @param {Number} instanceNumber instance index number
   * @returns {Boolean} whether an account is currently subscribing
   */
  isDisconnectedRetryMode(accountId, instanceNumber) {
    let instanceId = accountId + ':' + (instanceNumber || 0);
    return this._subscriptions[instanceId] ? this._subscriptions[instanceId].isDisconnectedRetryMode : false;
  }

  /**
   * Returns whether an account subscription is active
   * @param {String} accountId account id
   * @returns {Boolean} instance actual subscribe state
   */
  isSubscriptionActive(accountId) {
    return !!this._subscriptionState[accountId];
  }

  /**
   * Subscribes to the Metatrader terminal events
   * @param {String} accountId id of the MetaTrader account to subscribe to
   * @param {Number} instanceNumber instance index number
   * @returns {Promise} promise which resolves when subscription started
   */
  subscribe(accountId, instanceNumber) {
    this._subscriptionState[accountId] = true;
    return this._websocketClient.rpcRequest(accountId, {type: 'subscribe', instanceIndex: instanceNumber});
  }

  /**
   * Schedules to send subscribe requests to an account until cancelled
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   * @param {Boolean} isDisconnectedRetryMode whether to start subscription in disconnected retry
   * mode. Subscription task in disconnected mode will be immediately replaced when the status packet is received
   */
  async scheduleSubscribe(accountId, instanceNumber, isDisconnectedRetryMode = false) {
    const client = this._websocketClient;
    let instanceId = accountId + ':' + (instanceNumber || 0);
    if(!this._subscriptions[instanceId]) {
      this._subscriptions[instanceId] = {
        shouldRetry: true,
        task: null,
        waitTask: null,
        future: null,
        isDisconnectedRetryMode
      };
      let subscribeRetryIntervalInSeconds = 3;
      while(this._subscriptions[instanceId].shouldRetry) {
        let resolveSubscribe;
        this._subscriptions[instanceId].task = {promise: new Promise((res) => {
          resolveSubscribe = res;
        })};
        this._subscriptions[instanceId].task.resolve = resolveSubscribe;
        // eslint-disable-next-line no-inner-declarations
        let subscribeTask = async () => {
          try {
            await this.subscribe(accountId, instanceNumber);
          } catch (err) {
            if(err.name === 'TooManyRequestsError') {
              const socketInstanceIndex = client.socketInstancesByAccounts[instanceNumber][accountId];
              if (err.metadata.type === 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER') {
                this._logger.error(`${instanceId}: Failed to subscribe`, err);
              }
              if (['LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER', 'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_SERVER', 
                'LIMIT_ACCOUNT_SUBSCRIPTIONS_PER_USER_PER_SERVER'].includes(err.metadata.type)) {
                delete client.socketInstancesByAccounts[instanceNumber][accountId];
                client.lockSocketInstance(instanceNumber, socketInstanceIndex, 
                  this._websocketClient.getAccountRegion(accountId), err.metadata);
              } else {
                const retryTime = new Date(err.metadata.recommendedRetryTime).getTime();
                if (Date.now() + subscribeRetryIntervalInSeconds * 1000 < retryTime) {
                  await new Promise(res => setTimeout(res, retryTime - Date.now() -
                    subscribeRetryIntervalInSeconds * 1000));
                }
              }
            }
          }
          resolveSubscribe();
        };
        subscribeTask();
        await this._subscriptions[instanceId].task.promise;
        if(!this._subscriptions[instanceId].shouldRetry) {
          break;
        }
        const retryInterval = subscribeRetryIntervalInSeconds;
        subscribeRetryIntervalInSeconds = Math.min(subscribeRetryIntervalInSeconds * 2, 300);
        let resolve;
        let subscribePromise = new Promise((res) => {
          resolve = res;
        });
        this._subscriptions[instanceId].waitTask = setTimeout(() => {
          resolve(true);
        }, retryInterval * 1000);
        this._subscriptions[instanceId].future = {resolve, promise: subscribePromise};
        const result = await this._subscriptions[instanceId].future.promise;
        this._subscriptions[instanceId].future = null;
        if (!result) {
          break;
        }
      }
      delete this._subscriptions[instanceId];
    }
  }

  /**
   * Unsubscribe from account
   * @param {String} accountId id of the MetaTrader account to unsubscribe
   * @param {Number} instanceNumber instance index number
   * @returns {Promise} promise which resolves when socket unsubscribed
   */
  async unsubscribe(accountId, instanceNumber) {
    this.cancelAccount(accountId);
    delete this._subscriptionState[accountId];
    return this._websocketClient.rpcRequest(accountId, {type: 'unsubscribe', instanceIndex: instanceNumber});
  }

  /**
   * Cancels active subscription tasks for an instance id
   * @param {String} instanceId instance id to cancel subscription task for
   */
  cancelSubscribe(instanceId) {
    if(this._subscriptions[instanceId]) {
      const subscription = this._subscriptions[instanceId];
      if(subscription.future) {
        subscription.future.resolve(false);
        clearTimeout(subscription.waitTask);
      }
      if(subscription.task) {
        subscription.task.resolve(false);
      }
      subscription.shouldRetry = false;
    }
  }

  /**
   * Cancels active subscription tasks for an account
   * @param {String} accountId account id to cancel subscription tasks for
   */
  cancelAccount(accountId) {
    for (let instanceId of Object.keys(this._subscriptions).filter(key => key.startsWith(accountId))) {
      this.cancelSubscribe(instanceId);
    }
    Object.keys(this._awaitingResubscribe).forEach(instanceNumber => 
      delete this._awaitingResubscribe[instanceNumber][accountId]);
  }

  /**
   * Invoked on account timeout.
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   */
  onTimeout(accountId, instanceNumber) {
    const region = this._websocketClient.getAccountRegion(accountId);
    if(this._websocketClient.socketInstancesByAccounts[instanceNumber][accountId] !== undefined && 
      this._websocketClient.connected(instanceNumber, 
        this._websocketClient.socketInstancesByAccounts[instanceNumber][accountId], region)) {
      this._logger.debug(`${accountId}:${instanceNumber}: scheduling subscribe because of account timeout`);
      this.scheduleSubscribe(accountId, instanceNumber, true);
    }
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} accountId id of the MetaTrader account
   * @param {Number} instanceNumber instance index number
   */
  async onDisconnected(accountId, instanceNumber) {
    await new Promise(res => setTimeout(res, Math.max(Math.random() * 5, 1) * 1000));
    if(this._websocketClient.socketInstancesByAccounts[instanceNumber][accountId] !== undefined) {
      this._logger.debug(`${accountId}:${instanceNumber}: scheduling subscribe because account disconnected`);
      this.scheduleSubscribe(accountId, instanceNumber, true);
    }
  }

  /**
   * Invoked when connection to MetaApi websocket API restored after a disconnect.
   * @param {Number} instanceNumber instance index number
   * @param {Number} socketInstanceIndex socket instance index
   * @param {String[]} reconnectAccountIds account ids to reconnect
   */
  onReconnected(instanceNumber, socketInstanceIndex, reconnectAccountIds) {
    if(!this._awaitingResubscribe[instanceNumber]) {
      this._awaitingResubscribe[instanceNumber] = {};
    }
    try {
      const socketInstancesByAccounts = this._websocketClient.socketInstancesByAccounts[instanceNumber];
      for(let instanceId of Object.keys(this._subscriptions)){
        const accountId = instanceId.split(':')[0];
        if (socketInstancesByAccounts[accountId] === socketInstanceIndex) {
          this.cancelSubscribe(instanceId);
        }
      }
      reconnectAccountIds.forEach(async accountId => {
        try {
          if(!this._awaitingResubscribe[instanceNumber][accountId]) {
            this._awaitingResubscribe[instanceNumber][accountId] = true;
            while(this.isAccountSubscribing(accountId, instanceNumber)) {
              await new Promise(res => setTimeout(res, 1000));
            }
            await new Promise(res => setTimeout(res, Math.random() * 5000));
            if(this._awaitingResubscribe[instanceNumber][accountId]) {
              delete this._awaitingResubscribe[instanceNumber][accountId];
              this._logger.debug(`${accountId}:${instanceNumber}: scheduling subscribe because account reconnected`);
              this.scheduleSubscribe(accountId, instanceNumber);
            }
          }
        } catch (err) {
          this._logger.error(`${accountId}: Account resubscribe task failed`, err);
        }
      });
    } catch (err) {
      this._logger.error('Failed to process subscribe manager reconnected event', err);
    }
  }
}