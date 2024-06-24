'use strict';

import crypto from 'crypto-js';
import SynchronizationListener from '../clients/metaApi/synchronizationListener';
import LoggerManager from '../logger';

/**
 * Responsible for storing a local copy of remote terminal state
 */
export default class TerminalState extends SynchronizationListener {

  /**
   * Constructs the instance of terminal state class
   * @param {string} accountId account id
   * @param {ClientApiClient} clientApiClient client api client
   */
  constructor(accountId, clientApiClient) {
    super();
    this._accountId = accountId;
    this._clientApiClient = clientApiClient;
    this._stateByInstanceIndex = {};
    this._waitForPriceResolves = {};
    this._combinedState = {
      accountInformation: undefined,
      positions: [],
      orders: [],
      specificationsBySymbol: {},
      pricesBySymbol: {},
      completedOrders: {},
      removedPositions: {},
      ordersInitialized: false,
      positionsInitialized: false,
      lastUpdateTime: 0,
      lastQuoteTime: undefined,
      lastQuoteBrokerTime: undefined
    };
    this._logger = LoggerManager.getLogger('TerminalState');
  }

  /**
   * Returns true if MetaApi have connected to MetaTrader terminal
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal
   */
  get connected() {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => acc || s.connected, false);
  }

  /**
   * Returns true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to broker
   * @return {Boolean} true if MetaApi have connected to MetaTrader terminal and MetaTrader terminal is connected to
   * broker
   */
  get connectedToBroker() {
    return Object.values(this._stateByInstanceIndex).reduce((acc, s) => acc || s.connectedToBroker, false);
  }

  /**
   * Returns a local copy of account information
   * @returns {MetatraderAccountInformation} local copy of account information
   */
  get accountInformation() {
    return this._combinedState.accountInformation;
  }

  /**
   * Returns a local copy of MetaTrader positions opened
   * @returns {Array<MetatraderPosition>} a local copy of MetaTrader positions opened
   */
  get positions() {
    return this._combinedState.positions;
  }

  /**
   * Returns a local copy of MetaTrader orders opened
   * @returns {Array<MetatraderOrder>} a local copy of MetaTrader orders opened
   */
  get orders() {
    return this._combinedState.orders;
  }

  /**
   * Returns a local copy of symbol specifications available in MetaTrader trading terminal
   * @returns {Array<MetatraderSymbolSpecification>} a local copy of symbol specifications available in MetaTrader
   * trading terminal
   */
  get specifications() {
    return Object.values(this._combinedState.specificationsBySymbol);
  }

  /**
   * Returns hashes of terminal state data for incremental synchronization
   * @param {String} accountType account type
   * @param {String} instanceIndex index of instance to get hashes of
   * @returns {Promise<Object>} promise resolving with hashes of terminal state data
   */
  // eslint-disable-next-line complexity
  async getHashes(accountType, instanceIndex) {
    let requestedState = this._getState(instanceIndex);
    // get latest instance number state
    const region = instanceIndex.split(':')[0];
    const hashFields = await this._clientApiClient.getHashingIgnoredFieldLists(region);
    const instanceNumber = instanceIndex.split(':')[1];
    const instanceNumberStates = Object.keys(this._stateByInstanceIndex)
      .filter(stateInstanceIndex => stateInstanceIndex.startsWith(`${region}:${instanceNumber}:`));
    instanceNumberStates.sort((a,b) => b.lastSyncUpdateTime - a.lastSyncUpdateTime);
    const state = this._getState(instanceNumberStates[0]);

    const sortByKey = (obj1, obj2, key) => {
      if(obj1[key] < obj2[key]) {
        return -1;
      }
      if(obj1[key] > obj2[key]) {
        return 1;
      }
      return 0;
    };
    const specifications = JSON.parse(JSON.stringify(Object.values(state.specificationsBySymbol)));
    specifications.sort((a,b) => sortByKey(a, b, 'symbol'));
    specifications.forEach(specification => {
      if(accountType === 'cloud-g1') {
        hashFields.g1.specification.forEach(field => delete specification[field]);
      } else if(accountType === 'cloud-g2') {
        hashFields.g2.specification.forEach(field => delete specification[field]);
      }
    });
    const specificationsHash = specifications.length ? 
      state.specificationsHash || this._getHash(specifications, accountType, ['digits']) : null;
    state.specificationsHash = specificationsHash;

    const positions = JSON.parse(JSON.stringify(state.positions));
    if(accountType === 'cloud-g1') {
      positions.sort((a,b) => Number(a.id) - Number(b.id));
    } else {
      positions.sort((a,b) => sortByKey(a, b, 'id'));
    }
    positions.forEach(position => {
      if(accountType === 'cloud-g1') {
        hashFields.g1.position.forEach(field => delete position[field]);
      } else if(accountType === 'cloud-g2') {
        hashFields.g2.position.forEach(field => delete position[field]);
      }
    });
    const positionsHash = state.positionsInitialized ? 
      state.positionsHash || this._getHash(positions, accountType, ['magic']) : null;
    state.positionsHash = positionsHash;

    const orders = JSON.parse(JSON.stringify(state.orders));
    if(accountType === 'cloud-g1') {
      orders.sort((a,b) => Number(a.id) - Number(b.id));
    } else {
      orders.sort((a,b) => sortByKey(a, b, 'id'));
    }
    orders.forEach(order => {
      if(accountType === 'cloud-g1') {
        hashFields.g1.order.forEach(field => delete order[field]);
      } else if(accountType === 'cloud-g2') {
        hashFields.g2.order.forEach(field => delete order[field]);
      }
    });
    const ordersHash = state.ordersInitialized ? 
      state.ordersHash || this._getHash(orders, accountType, ['magic']) : null;
    state.ordersHash = ordersHash;

    if (requestedState !== state) {
      requestedState.specificationsBySymbol = Object.assign({}, state.specificationsBySymbol || {});
      requestedState.specificationsHash = specificationsHash;
      requestedState.positions = (state.positions || []).map(p => Object.assign({}, p));
      requestedState.positionsHash = positionsHash;
      requestedState.orders = (state.orders || []).map(o => Object.assign({}, o));
      requestedState.ordersHash = ordersHash;
    }

    return {
      specificationsMd5: specificationsHash,
      positionsMd5: positionsHash,
      ordersMd5: ordersHash
    };
  }

  /**
   * Returns MetaTrader symbol specification by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolSpecification} MetatraderSymbolSpecification found or undefined if specification for a
   * symbol is not found
   */
  specification(symbol) {
    return this._combinedState.specificationsBySymbol[symbol];
  }

  /**
   * Returns MetaTrader symbol price by symbol
   * @param {String} symbol symbol (e.g. currency pair or an index)
   * @return {MetatraderSymbolPrice} MetatraderSymbolPrice found or undefined if price for a symbol is not found
   */
  price(symbol) {
    return this._combinedState.pricesBySymbol[symbol];
  }

  /**
   * Quote time
   * @typdef {Object} QuoteTime
   * @property {Date} time quote time
   * @property {String} brokerTime quote time in broker timezone, YYYY-MM-DD HH:mm:ss.SSS format
   */

  /**
   * Returns time of the last received quote
   * @return {QuoteTime} time of the last received quote
   */
  get lastQuoteTime() {
    if (this._combinedState.lastQuoteTime) {
      return {
        time: this._combinedState.lastQuoteTime,
        brokerTime: this._combinedState.lastQuoteBrokerTime,
      };
    } else {
      return undefined;
    }
  }

  /**
   * Waits for price to be received
   * @param {string} symbol symbol (e.g. currency pair or an index)
   * @param {number} [timeoutInSeconds] timeout in seconds, default is 30
   * @return {Promise<MetatraderSymbolPrice>} promise resolving with price or undefined if price has not been received
   */
  async waitForPrice(symbol, timeoutInSeconds = 30) {
    this._waitForPriceResolves[symbol] = this._waitForPriceResolves[symbol] || [];
    if (!this.price(symbol)) {
      await Promise.race([
        new Promise(res => this._waitForPriceResolves[symbol].push(res)),
        new Promise(res => setTimeout(res, timeoutInSeconds * 1000))
      ]);
    }
    return this.price(symbol);
  }

  /**
   * Invoked when connection to MetaTrader terminal established
   * @param {String} instanceIndex index of an account instance connected
   */
  onConnected(instanceIndex) {
    this._getState(instanceIndex).connected = true;
  }

  /**
   * Invoked when connection to MetaTrader terminal terminated
   * @param {String} instanceIndex index of an account instance connected
   */
  onDisconnected(instanceIndex) {
    let state = this._getState(instanceIndex);
    state.connected = false;
    state.connectedToBroker = false;
  }

  /**
   * Invoked when broker connection status have changed
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} connected is MetaTrader terminal is connected to broker
   */
  onBrokerConnectionStatusChanged(instanceIndex, connected) {
    this._getState(instanceIndex).connectedToBroker = connected;
  }

  /**
   * Invoked when MetaTrader terminal state synchronization is started
   * @param {String} instanceIndex index of an account instance connected
   * @param {Boolean} specificationsUpdated whether specifications are going to be updated during synchronization
   * @param {Boolean} positionsUpdated whether positions are going to be updated during synchronization
   * @param {Boolean} ordersUpdated whether orders are going to be updated during synchronization
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onSynchronizationStarted(instanceIndex, specificationsUpdated, positionsUpdated, ordersUpdated, synchronizationId) {
    const unsynchronizedStates = this._getStateIndicesOfSameInstanceNumber(instanceIndex)
      .filter(stateIndex => !this._stateByInstanceIndex[stateIndex].ordersInitialized);
    unsynchronizedStates.sort((a,b) => b.lastSyncUpdateTime - a.lastSyncUpdateTime);
    unsynchronizedStates.slice(1).forEach(stateIndex => delete this._stateByInstanceIndex[stateIndex]);

    let state = this._getState(instanceIndex);
    state.lastSyncUpdateTime = Date.now();
    state.accountInformation = undefined;
    state.pricesBySymbol = {};
    if(positionsUpdated) {
      state.positions = [];
      state.removedPositions = {};
      state.positionsInitialized = false;
      state.positionsHash = null;
    }
    if(ordersUpdated) {
      state.orders = [];
      state.completedOrders = {};
      state.ordersInitialized = false;
      state.ordersHash = null;
    }
    if(specificationsUpdated) {
      this._logger.trace(() => `${this._accountId}:${instanceIndex}:${synchronizationId}: cleared specifications ` +
        'on synchronization start');
      state.specificationsBySymbol = {};
      state.specificationsHash = null;
    } else {
      this._logger.trace(() => `${this._accountId}:${instanceIndex}:${synchronizationId}: no need to clear ` +
        `specifications on synchronization start, ${Object.keys(state.specificationsBySymbol || {}).length} ` +
        'specifications reused');
    }
  }

  /**
   * Invoked when MetaTrader account information is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderAccountInformation} accountInformation updated MetaTrader account information
   */
  onAccountInformationUpdated(instanceIndex, accountInformation) {
    let state = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    state.accountInformation = accountInformation;
    if (accountInformation) {
      this._combinedState.accountInformation = Object.assign({}, accountInformation);
    }
  }

  /**
   * Invoked when the positions are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderPosition>} positions updated array of positions
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsReplaced(instanceIndex, positions) {
    let state = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    state.positions = positions;
    state.positionsHash = null;
  }

  /**
   * Invoked when position synchronization fnished to indicate progress of an initial terminal state synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPositionsSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.removedPositions = {};
    state.positionsInitialized = true;
  }

  /**
   * Invoked when MetaTrader position is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderPosition} position updated MetaTrader position
   */
  onPositionUpdated(instanceIndex, position) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    instanceState.positionsHash = null;

    const updatePosition = (state) => {
      let index = state.positions.findIndex(p => p.id === position.id);
      if (index !== -1) {
        state.positions[index] = position;
      } else if (!state.removedPositions[position.id]) {
        state.positions.push(position);
      }
    };
    updatePosition(instanceState);
    updatePosition(this._combinedState);
  }

  /**
   * Invoked when MetaTrader position is removed
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} positionId removed MetaTrader position id
   */
  onPositionRemoved(instanceIndex, positionId) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    instanceState.positionsHash = null;

    const removePosition = (state) => {
      let position = state.positions.find(p => p.id === positionId);
      if (!position) {
        for (let e of Object.entries(state.removedPositions)) {
          if (e[1] + 5 * 60 * 1000 < Date.now()) {
            delete state.removedPositions[e[0]];
          }
        }
        state.removedPositions[positionId] = Date.now();
      } else {
        state.positions = state.positions.filter(p => p.id !== positionId);
      }
    };
    removePosition(instanceState);
    removePosition(this._combinedState);
  }

  /**
   * Invoked when the orders are replaced as a result of initial terminal state synchronization
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderOrder>} orders updated array of pending orders
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrdersReplaced(instanceIndex, orders) {
    let state = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    state.ordersHash = null;
    state.orders = orders;
  }

  /**
   * Invoked when pending order synchronization fnished to indicate progress of an initial terminal state
   * synchronization
   * @param {string} instanceIndex index of an account instance connected
   * @param {String} synchronizationId synchronization request id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onPendingOrdersSynchronized(instanceIndex, synchronizationId) {
    let state = this._getState(instanceIndex);
    state.completedOrders = {};
    state.positionsInitialized = true;
    state.ordersInitialized = true;
    this._combinedState.accountInformation = state.accountInformation ? Object.assign({}, state.accountInformation) :
      undefined;
    this._combinedState.positions = (state.positions || []).map(p => Object.assign({}, p));
    this._combinedState.orders = (state.orders || []).map(o => Object.assign({}, o));
    this._combinedState.specificationsBySymbol = Object.assign({}, state.specificationsBySymbol);
    this._logger.trace(() => `${this._accountId}:${instanceIndex}:${synchronizationId}: assigned specifications to ` +
      'combined state from ' +
      `${instanceIndex}, ${Object.keys(state.specificationsBySymbol || {}).length} specifications assigned`);
    this._combinedState.positionsInitialized = true;
    this._combinedState.ordersInitialized = true;
    this._combinedState.completedOrders = {};
    this._combinedState.removedPositions = {};
    for(let stateIndex of this._getStateIndicesOfSameInstanceNumber(instanceIndex)) {
      if (!this._stateByInstanceIndex[stateIndex].connected) {
        delete this._stateByInstanceIndex[stateIndex];
      }
    }
  }

  /**
   * Invoked when MetaTrader pending order is updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {MetatraderOrder} order updated MetaTrader pending order
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderUpdated(instanceIndex, order) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    instanceState.ordersHash = null;
    
    const updatePendingOrder = (state) => {
      let index = state.orders.findIndex(o => o.id === order.id);
      if (index !== -1) {
        state.orders[index] = order;
      } else if (!state.completedOrders[order.id]) {
        state.orders.push(order);
      }
    };
    updatePendingOrder(instanceState);
    updatePendingOrder(this._combinedState);
  }

  /**
   * Invoked when MetaTrader pending order is completed (executed or canceled)
   * @param {String} instanceIndex index of an account instance connected
   * @param {String} orderId completed MetaTrader pending order id
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  onPendingOrderCompleted(instanceIndex, orderId) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    instanceState.ordersHash = null;

    const completeOrder = (state) => {
      let order = state.orders.find(o => o.id === orderId);
      if (!order) {
        for (let e of Object.entries(state.completedOrders)) {
          if (e[1] + 5 * 60 * 1000 < Date.now()) {
            delete state.completedOrders[e[0]];
          }
        }
        state.completedOrders[orderId] = Date.now();
      } else {
        state.orders = state.orders.filter(o => o.id !== orderId);
      }
    };
    completeOrder(instanceState);
    completeOrder(this._combinedState);
  }

  /**
   * Invoked when a symbol specification was updated
   * @param {String} instanceIndex index of account instance connected
   * @param {Array<MetatraderSymbolSpecification>} specifications updated specifications
   * @param {Array<String>} removedSymbols removed symbols
   */
  onSymbolSpecificationsUpdated(instanceIndex, specifications, removedSymbols) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);
    instanceState.specificationsHash = null;

    const updateSpecifications = (state) => {
      for (let specification of specifications) {
        state.specificationsBySymbol[specification.symbol] = specification;
      }
      for (let symbol of removedSymbols) {
        delete state.specificationsBySymbol[symbol];
      }
    };
    updateSpecifications(instanceState);
    updateSpecifications(this._combinedState);
    this._logger.trace(() => `${this._accountId}:${instanceIndex}: updated ${specifications.length} specifications, ` +
      `removed ${removedSymbols.length} specifications. There are ` +
      `${Object.keys(instanceState.specificationsBySymbol || {}).length} specifications after update`);
  }

  /**
   * Invoked when prices for several symbols were updated
   * @param {String} instanceIndex index of an account instance connected
   * @param {Array<MetatraderSymbolPrice>} prices updated MetaTrader symbol prices
   * @param {Number} equity account liquidation value
   * @param {Number} margin margin used
   * @param {Number} freeMargin free margin
   * @param {Number} marginLevel margin level calculated as % of equity/margin
   */
  // eslint-disable-next-line complexity
  onSymbolPricesUpdated(instanceIndex, prices, equity, margin, freeMargin, marginLevel) {
    let instanceState = this._getState(instanceIndex);
    this._refreshStateUpdateTime(instanceIndex);

    // eslint-disable-next-line complexity,max-statements
    const updateSymbolPrices = (state) => {
      state.lastUpdateTime = Math.max(prices.map(p => p.time.getTime()));
      let pricesInitialized = false;
      let priceUpdated = false;
      for (let price of prices || []) {
        let currentPrice = state.pricesBySymbol[price.symbol];
        if (currentPrice && currentPrice.time.getTime() > price.time.getTime()) {
          continue;
        } else {
          priceUpdated = true;
        }
        if (!state.lastQuoteTime || state.lastQuoteTime.getTime() < price.time.getTime()) {
          state.lastQuoteTime = price.time;
          state.lastQuoteBrokerTime = price.brokerTime;
        }
        state.pricesBySymbol[price.symbol] = price;
        let positions = state.positions.filter(p => p.symbol === price.symbol);
        let otherPositions = state.positions.filter(p => p.symbol !== price.symbol);
        let orders = state.orders.filter(o => o.symbol === price.symbol);
        pricesInitialized = true;
        for (let position of otherPositions) {
          let p = state.pricesBySymbol[position.symbol];
          if (p) {
            if (position.unrealizedProfit === undefined) {
              this._updatePositionProfits(position, p);
            }
          } else {
            pricesInitialized = false;
          }
        }
        for (let position of positions) {
          this._updatePositionProfits(position, price);
        }
        for (let order of orders) {
          order.currentPrice = order.type === 'ORDER_TYPE_BUY' || order.type === 'ORDER_TYPE_BUY_LIMIT' ||
          order.type === 'ORDER_TYPE_BUY_STOP' || order.type === 'ORDER_TYPE_BUY_STOP_LIMIT' ? price.ask : price.bid;
        }
        let priceResolves = this._waitForPriceResolves[price.symbol] || [];
        if (priceResolves.length) {
          for (let resolve of priceResolves) {
            resolve();
          }
          delete this._waitForPriceResolves[price.symbol];
        }
      }
      if (priceUpdated && state.accountInformation) {
        if (state.positionsInitialized && pricesInitialized) {
          if (state.accountInformation.platform === 'mt5') {
            state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.balance +
              state.positions.reduce((acc, p) => acc +
                Math.round((p.unrealizedProfit || 0) * 100) / 100 + Math.round((p.swap || 0) * 100) / 100, 0);
          } else {
            state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.balance +
            state.positions.reduce((acc, p) => acc + Math.round((p.swap || 0) * 100) / 100 +
              Math.round((p.commission || 0) * 100) / 100 + Math.round((p.unrealizedProfit || 0) * 100) / 100, 0);
          }
          state.accountInformation.equity = Math.round(state.accountInformation.equity * 100) / 100;
        } else {
          state.accountInformation.equity = equity !== undefined ? equity : state.accountInformation.equity;
        }
        state.accountInformation.margin = margin !== undefined ? margin : state.accountInformation.margin;
        state.accountInformation.freeMargin = freeMargin !== undefined ? freeMargin : 
          state.accountInformation.freeMargin;
        state.accountInformation.marginLevel = freeMargin !== undefined ? marginLevel :
          state.accountInformation.marginLevel;
      }
    };
    updateSymbolPrices(instanceState);
    updateSymbolPrices(this._combinedState);
  }

  /**
   * Invoked when a stream for an instance index is closed
   * @param {String} instanceIndex index of an account instance connected
   * @return {Promise} promise which resolves when the asynchronous event is processed
   */
  async onStreamClosed(instanceIndex) {
    if(this._stateByInstanceIndex[instanceIndex]) {
      for(let stateIndex of this._getStateIndicesOfSameInstanceNumber(instanceIndex)) {
        const instanceState = this._stateByInstanceIndex[stateIndex];
        if(!this._stateByInstanceIndex[instanceIndex].ordersInitialized 
            && this._stateByInstanceIndex[instanceIndex].lastSyncUpdateTime <= instanceState.lastSyncUpdateTime) {
          delete this._stateByInstanceIndex[instanceIndex];
          break;
        }
        if(instanceState.connected && instanceState.ordersInitialized) {
          delete this._stateByInstanceIndex[instanceIndex];
          break;
        }
      }
    }
  }

  _refreshStateUpdateTime(instanceIndex){
    const state = this._stateByInstanceIndex[instanceIndex];
    if(state && state.ordersInitialized) {
      state.lastSyncUpdateTime = Date.now();
    }
  }

  _getStateIndicesOfSameInstanceNumber(instanceIndex) {
    const region = instanceIndex.split(':')[0];
    const instanceNumber = instanceIndex.split(':')[1];
    return Object.keys(this._stateByInstanceIndex)
      .filter(stateInstanceIndex => stateInstanceIndex.startsWith(`${region}:${instanceNumber}:`) && 
      instanceIndex !== stateInstanceIndex);
  }

  // eslint-disable-next-line complexity
  _updatePositionProfits(position, price) {
    let specification = this.specification(position.symbol);
    if (specification) {
      let multiplier = Math.pow(10, specification.digits);
      if (position.profit !== undefined) {
        position.profit = Math.round(position.profit * multiplier) / multiplier;
      }
      if (position.unrealizedProfit === undefined || position.realizedProfit === undefined) {
        position.unrealizedProfit = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) *
          (position.currentPrice - position.openPrice) * position.currentTickValue *
          position.volume / specification.tickSize;
        position.unrealizedProfit = Math.round(position.unrealizedProfit * multiplier) / multiplier;
        position.realizedProfit = position.profit - position.unrealizedProfit;
      }
      let newPositionPrice = position.type === 'POSITION_TYPE_BUY' ? price.bid : price.ask;
      let isProfitable = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) * (newPositionPrice - position.openPrice);
      let currentTickValue = (isProfitable > 0 ? price.profitTickValue : price.lossTickValue);
      let unrealizedProfit = (position.type === 'POSITION_TYPE_BUY' ? 1 : -1) *
        (newPositionPrice - position.openPrice) * currentTickValue *
        position.volume / specification.tickSize;
      unrealizedProfit = Math.round(unrealizedProfit * multiplier) / multiplier;
      position.unrealizedProfit = unrealizedProfit;
      position.profit = position.unrealizedProfit + position.realizedProfit;
      position.profit = Math.round(position.profit * multiplier) / multiplier;
      position.currentPrice = newPositionPrice;
      position.currentTickValue = currentTickValue;
    }
  }
  
  _getState(instanceIndex) {
    if (!this._stateByInstanceIndex['' + instanceIndex]) {
      this._logger.trace(`${this._accountId}:${instanceIndex}: constructed new state`);
      this._stateByInstanceIndex['' + instanceIndex] = this._constructTerminalState(instanceIndex);
    }
    return this._stateByInstanceIndex['' + instanceIndex];
  }

  _constructTerminalState(instanceIndex) {
    return {
      instanceIndex,
      connected: false,
      connectedToBroker: false,
      accountInformation: undefined,
      positions: [],
      orders: [],
      specificationsBySymbol: {},
      pricesBySymbol: {},
      completedOrders: {},
      removedPositions: {},
      ordersInitialized: false,
      positionsInitialized: false,
      lastUpdateTime: 0,
      lastSyncUpdateTime: 0,
      positionsHash: null,
      ordersHash: null,
      specificationsHash: null,
      lastQuoteTime: undefined,
      lastQuoteBrokerTime: undefined
    };
  }

  _getHash(obj, accountType, integerKeys) {
    let jsonItem = '';
    if(accountType === 'cloud-g1') {
      const stringify = (objFromJson, key) => {
        if(typeof objFromJson === 'number') {
          if(integerKeys.includes(key)) {
            return objFromJson;
          } else {
            return objFromJson.toFixed(8);
          }
        } else if(Array.isArray(objFromJson)) {
          return `[${objFromJson.map(item => stringify(item)).join(',')}]`; 
        } else if (objFromJson === null) {
          return objFromJson;
        } else if (typeof objFromJson !== 'object' || objFromJson.getTime){
          return JSON.stringify(objFromJson);
        }
    
        let props = Object
          .keys(objFromJson)
          .map(keyItem => `"${keyItem}":${stringify(objFromJson[keyItem], keyItem)}`)
          .join(',');
        return `{${props}}`;
      };
    
      jsonItem = stringify(obj);
    } else if(accountType === 'cloud-g2') {
      const stringify = (objFromJson, key) => {
        if(typeof objFromJson === 'number') {
          if(integerKeys.includes(key)) {
            return objFromJson;
          } else {
            return parseFloat(objFromJson.toFixed(8));
          }
        } else if(Array.isArray(objFromJson)) {
          return `[${objFromJson.map(item => stringify(item)).join(',')}]`; 
        } else if (objFromJson === null) {
          return objFromJson;
        } else if (typeof objFromJson !== 'object' || objFromJson.getTime){
          return JSON.stringify(objFromJson);
        }
    
        let props = Object
          .keys(objFromJson)
          .map(keyItem => `"${keyItem}":${stringify(objFromJson[keyItem], keyItem)}`)
          .join(',');
        return `{${props}}`;
      };

      jsonItem = stringify(obj);
    }
    return crypto.MD5(jsonItem).toString();
  }
  
}
