import { SynchronizationListener } from "metaapi.cloud-sdk";

class TradeShareSynchronizationListener extends SynchronizationListener {
  /**
   * Invoked when MetaTrader position is updated
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   */
  onPositionUpdated(instanceIndex, position) {
    console.log("Position:", position);
  }

  /**
   * Invoked when a new MetaTrader history order is added
   * @param {string} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} historyOrder new MetaTrader history order
   */
  onHistoryOrderAdded(instanceIndex, historyOrder) {
    console.log("HistoryOrder:", historyOrder);
  }

  /**
   * Invoked when MetaTrader position is removed
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} positionId removed MetaTrader position id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionRemoved(instanceIndex, positionId) {
    console.log("PositionId:", positionId);
  }

  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {string} instanceIndex index of an account instance connected
   * @param {string} orderId completed MetaTrader pending order id
   */
  onPendingOrderCompleted(instanceIndex, orderId) {
    console.log("OrderId:", orderId);
  }
}

module.exports = {
  TradeShareSynchronizationListener,
};
