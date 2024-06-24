'use strict';

import should from 'should';
import sinon from 'sinon';
import RpcMetaApiConnection from './rpcMetaApiConnection';
import NotSynchronizedError from '../clients/metaApi/notSynchronizedError';
import TimeoutError from '../clients/timeoutError';

/**
 * @test {MetaApiConnection}
 */
// eslint-disable-next-line max-statements
describe('RpcMetaApiConnection', () => {

  let sandbox;
  let api;
  let account;
  let clock;
  let client = {
    getAccountInformation: () => {},
    addSynchronizationListener: () => {},
    ensureSubscribe: () => {},
    getPositions: () => {},
    getPosition: () => {},
    getOrders: () => {},
    getOrder: () => {},
    getHistoryOrdersByTicket: () => {},
    getHistoryOrdersByPosition: () => {},
    getHistoryOrdersByTimeRange: () => {},
    getDealsByTicket: () => {},
    getDealsByPosition: () => {},
    getDealsByTimeRange: () => {},
    removeApplication: () => {},
    trade: () => {},
    reconnect: () => {},
    getSymbols: () => {},
    getSymbolSpecification: () => {},
    getSymbolPrice: () => {},
    getCandle: () => {},
    getTick: () => {},
    getBook: () => {},
    getServerTime: () => {},
    calculateMargin: () => {},
    waitSynchronized: () => {},
    addAccountCache: () => {},
    removeAccountCache: () => {}
  };

  let accountRegions = {
    'vint-hill': 'accountId',
    'new-york': 'accountIdReplica'
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    account = {
      id: 'accountId', 
      state: 'DEPLOYED',
      accountRegions,
      reload: () => {}
    };
    api = new RpcMetaApiConnection(client, account);
    clock = sinon.useFakeTimers({
      shouldAdvanceTime: true
    });
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  /**
   * @test {MetaApiConnection#waitSynchronized}
   */
  it('should wait until RPC application is synchronized', async () => {
    await api.connect();
    sandbox.stub(client, 'waitSynchronized').onFirstCall().rejects(new TimeoutError('test'))
      .onSecondCall().rejects(new TimeoutError('test'))
      .onThirdCall().resolves('response');
    (async () => {
      await new Promise(res => setTimeout(res, 50));
      await api.onConnected();
    })();
    clock.tickAsync(1100);
    await api.waitSynchronized();
  });

  /**
   * @test {MetaApiConnection#waitSynchronized}
   */
  it('should time out waiting for synchronization', async () => {
    await api.connect();
    sandbox.stub(client, 'waitSynchronized').callsFake(async () => {
      await new Promise(res => setTimeout(res, 100)); 
      throw new TimeoutError('test');
    });
    try {
      (async () => {
        await new Promise(res => setTimeout(res, 50));
        await api.onConnected();
      })();
      clock.tickAsync(1100);
      await api.waitSynchronized(0.09); 
      throw new Error('TimeoutError expected');
    } catch (err) {
      err.name.should.equal('TimeoutError');
    }
    sinon.assert.calledOnce(client.waitSynchronized);
  });

  /**
   * @test {MetaApiConnection#waitSynchronized}
   */
  it('should time out waiting for synchronization if no connected event has arrived', async () => {
    await api.connect();
    sandbox.stub(client, 'waitSynchronized').resolves();
    try {
      clock.tickAsync(1100);
      await api.waitSynchronized(0.09); 
      throw new Error('TimeoutError expected');
    } catch (err) {
      err.name.should.equal('TimeoutError');
    }
  });

  /**
   * @test {MetaApiConnection#getAccountInformation}
   */
  it('should retrieve account information', async () => {
    await api.connect();
    let accountInformation = {
      broker: 'True ECN Trading Ltd',
      currency: 'USD',
      server: 'ICMarketsSC-Demo',
      balance: 7319.9,
      equity: 7306.649913200001,
      margin: 184.1,
      freeMargin: 7120.22,
      leverage: 100,
      marginLevel: 3967.58283542
    };
    sandbox.stub(client, 'getAccountInformation').resolves(accountInformation);
    let actual = await api.getAccountInformation();
    actual.should.match(accountInformation);
    sinon.assert.calledWith(client.getAccountInformation, 'accountId');
  });

  /**
   * @test {MetaApiConnection#getAccountInformation}
   */
  it('should not process request if connection is not open', async () => {
    try {
      await api.getAccountInformation();
      throw new Error('Error is expected');
    } catch (err) {
      err.message.should.equal('This connection has not been initialized yet,' +
      ' please invoke await connection.connect()');
    }
  });

  /**
   * @test {MetaApiConnection#getAccountInformation}
   */
  it('should not process request if connection is closed', async () => {
    await api.connect();
    await api.close();
    try {
      await api.getAccountInformation();
      throw new Error('Error is expected');
    } catch (err) {
      err.message.should.equal('This connection has been closed, please create a new connection');
    }
  });

  /**
   * @test {MetaApiConnection#getPositions}
   */
  it('should retrieve positions', async () => {
    await api.connect();
    let positions = [{
      id: '46214692',
      type: 'POSITION_TYPE_BUY',
      symbol: 'GBPUSD',
      magic: 1000,
      time: new Date('2020-04-15T02:45:06.521Z'),
      updateTime: new Date('2020-04-15T02:45:06.521Z'),
      openPrice: 1.26101,
      currentPrice: 1.24883,
      currentTickValue: 1,
      volume: 0.07,
      swap: 0,
      profit: -85.25999999999966,
      commission: -0.25,
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      stopLoss: 1.17721,
      unrealizedProfit: -85.25999999999901,
      realizedProfit: -6.536993168992922e-13
    }];
    sandbox.stub(client, 'getPositions').resolves(positions);
    let actual = await api.getPositions();
    actual.should.match(positions);
    sinon.assert.calledWith(client.getPositions, 'accountId');
  });

  /**
   * @test {MetaApiConnection#getPosition}
   */
  it('should retrieve position by id', async () => {
    await api.connect();
    let position = {
      id: '46214692',
      type: 'POSITION_TYPE_BUY',
      symbol: 'GBPUSD',
      magic: 1000,
      time: new Date('2020-04-15T02:45:06.521Z'),
      updateTime: new Date('2020-04-15T02:45:06.521Z'),
      openPrice: 1.26101,
      currentPrice: 1.24883,
      currentTickValue: 1,
      volume: 0.07,
      swap: 0,
      profit: -85.25999999999966,
      commission: -0.25,
      clientId: 'TE_GBPUSD_7hyINWqAlE',
      stopLoss: 1.17721,
      unrealizedProfit: -85.25999999999901,
      realizedProfit: -6.536993168992922e-13
    };
    sandbox.stub(client, 'getPosition').resolves(position);
    let actual = await api.getPosition('46214692');
    actual.should.match(position);
    sinon.assert.calledWith(client.getPosition, 'accountId', '46214692');
  });

  /**
   * @test {MetaApiConnection#getOrders}
   */
  it('should retrieve orders', async () => {
    await api.connect();
    let orders = [{
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: new Date('2020-04-20T08:38:58.270Z'),
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2'
    }];
    sandbox.stub(client, 'getOrders').resolves(orders);
    let actual = await api.getOrders();
    actual.should.match(orders);
    sinon.assert.calledWith(client.getOrders, 'accountId');
  });

  /**
   * @test {MetaApiConnection#getOrder}
   */
  it('should retrieve order by id', async () => {
    await api.connect();
    let order = {
      id: '46871284',
      type: 'ORDER_TYPE_BUY_LIMIT',
      state: 'ORDER_STATE_PLACED',
      symbol: 'AUDNZD',
      magic: 123456,
      platform: 'mt5',
      time: new Date('2020-04-20T08:38:58.270Z'),
      openPrice: 1.03,
      currentPrice: 1.05206,
      volume: 0.01,
      currentVolume: 0.01,
      comment: 'COMMENT2'
    };
    sandbox.stub(client, 'getOrder').resolves(order);
    let actual = await api.getOrder('46871284');
    actual.should.match(order);
    sinon.assert.calledWith(client.getOrder, 'accountId', '46871284');
  });

  /**
   * @test {MetaApiConnection#getHistoryOrdersByTicket}
   */
  it('should retrieve history orders by ticket', async () => {
    await api.connect();
    let historyOrders = {
      historyOrders: [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        currentPrice: 1.261,
        currentVolume: 0,
        doneTime: new Date('2020-04-15T02:45:06.521Z'),
        id: '46214692',
        magic: 1000,
        platform: 'mt5',
        positionId: '46214692',
        state: 'ORDER_STATE_FILLED',
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.260Z'),
        type: 'ORDER_TYPE_BUY',
        volume: 0.07
      }],
      synchronizing: false
    };
    sandbox.stub(client, 'getHistoryOrdersByTicket').resolves(historyOrders);
    let actual = await api.getHistoryOrdersByTicket('46214692');
    actual.should.match(historyOrders);
    sinon.assert.calledWith(client.getHistoryOrdersByTicket, 'accountId', '46214692');
  });

  /**
   * @test {MetaApiConnection#getHistoryOrdersByPosition}
   */
  it('should retrieve history orders by position', async () => {
    await api.connect();
    let historyOrders = {
      historyOrders: [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        currentPrice: 1.261,
        currentVolume: 0,
        doneTime: new Date('2020-04-15T02:45:06.521Z'),
        id: '46214692',
        magic: 1000,
        platform: 'mt5',
        positionId: '46214692',
        state: 'ORDER_STATE_FILLED',
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.260Z'),
        type: 'ORDER_TYPE_BUY',
        volume: 0.07
      }],
      synchronizing: false
    };
    sandbox.stub(client, 'getHistoryOrdersByPosition').resolves(historyOrders);
    let actual = await api.getHistoryOrdersByPosition('46214692');
    actual.should.match(historyOrders);
    sinon.assert.calledWith(client.getHistoryOrdersByPosition, 'accountId', '46214692');
  });

  /**
   * @test {MetaApiConnection#getHistoryOrdersByTimeRange}
   */
  it('should retrieve history orders by time range', async () => {
    await api.connect();
    let historyOrders = {
      historyOrders: [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        currentPrice: 1.261,
        currentVolume: 0,
        doneTime: new Date('2020-04-15T02:45:06.521Z'),
        id: '46214692',
        magic: 1000,
        platform: 'mt5',
        positionId: '46214692',
        state: 'ORDER_STATE_FILLED',
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.260Z'),
        type: 'ORDER_TYPE_BUY',
        volume: 0.07
      }],
      synchronizing: false
    };
    sandbox.stub(client, 'getHistoryOrdersByTimeRange').resolves(historyOrders);
    let startTime = new Date(Date.now() - 1000);
    let endTime = new Date();
    let actual = await api.getHistoryOrdersByTimeRange(startTime, endTime, 1, 100);
    actual.should.match(historyOrders);
    sinon.assert.calledWith(client.getHistoryOrdersByTimeRange, 'accountId', startTime, endTime, 1, 100);
  });

  /**
   * @test {MetaApiConnection#getDealsByTicket}
   */
  it('should retrieve history deals by ticket', async () => {
    await api.connect();
    let deals = {
      deals: [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        commission: -0.25,
        entryType: 'DEAL_ENTRY_IN',
        id: '33230099',
        magic: 1000,
        platform: 'mt5',
        orderId: '46214692',
        positionId: '46214692',
        price: 1.26101,
        profit: 0,
        swap: 0,
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.521Z'),
        type: 'DEAL_TYPE_BUY',
        volume: 0.07
      }],
      synchronizing: false
    };
    sandbox.stub(client, 'getDealsByTicket').resolves(deals);
    let actual = await api.getDealsByTicket('46214692');
    actual.should.match(deals);
    sinon.assert.calledWith(client.getDealsByTicket, 'accountId', '46214692');
  });

  /**
   * @test {MetaApiConnection#getDealsByPosition}
   */
  it('should retrieve history deals by position', async () => {
    await api.connect();
    let deals = {
      deals: [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        commission: -0.25,
        entryType: 'DEAL_ENTRY_IN',
        id: '33230099',
        magic: 1000,
        platform: 'mt5',
        orderId: '46214692',
        positionId: '46214692',
        price: 1.26101,
        profit: 0,
        swap: 0,
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.521Z'),
        type: 'DEAL_TYPE_BUY',
        volume: 0.07
      }],
      synchronizing: false
    };
    sandbox.stub(client, 'getDealsByPosition').resolves(deals);
    let actual = await api.getDealsByPosition('46214692');
    actual.should.match(deals);
    sinon.assert.calledWith(client.getDealsByPosition, 'accountId', '46214692');
  });

  /**
   * @test {MetaApiConnection#getDealsByTimeRange}
   */
  it('should retrieve history deals by time range', async () => {
    await api.connect();
    let deals = {
      deals: [{
        clientId: 'TE_GBPUSD_7hyINWqAlE',
        commission: -0.25,
        entryType: 'DEAL_ENTRY_IN',
        id: '33230099',
        magic: 1000,
        platform: 'mt5',
        orderId: '46214692',
        positionId: '46214692',
        price: 1.26101,
        profit: 0,
        swap: 0,
        symbol: 'GBPUSD',
        time: new Date('2020-04-15T02:45:06.521Z'),
        type: 'DEAL_TYPE_BUY',
        volume: 0.07
      }],
      synchronizing: false
    };
    sandbox.stub(client, 'getDealsByTimeRange').resolves(deals);
    let startTime = new Date(Date.now() - 1000);
    let endTime = new Date();
    let actual = await api.getDealsByTimeRange(startTime, endTime, 1, 100);
    actual.should.match(deals);
    sinon.assert.calledWith(client.getDealsByTimeRange, 'accountId', startTime, endTime, 1, 100);
  });

  /**
   * @test {MetaApiConnection#createMarketBuyOrder}
   */
  it('should create market buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createMarketBuyOrder('GBPUSD', 0.07, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY', symbol: 'GBPUSD',
      volume: 0.07, stopLoss: 0.9, takeProfit: 2.0, comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createMarketBuyOrder}
   */
  it('should create market buy order with relative SL/TP', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createMarketBuyOrder('GBPUSD', 0.07, {value: 0.1, units: 'RELATIVE_PRICE'},
      {value: 2000, units: 'RELATIVE_POINTS'}, {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY', symbol: 'GBPUSD',
      volume: 0.07, stopLoss: 0.1, stopLossUnits: 'RELATIVE_PRICE', takeProfit: 2000,
      takeProfitUnits: 'RELATIVE_POINTS', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createMarketSellOrder}
   */
  it('should create market sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createMarketSellOrder('GBPUSD', 0.07, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL', symbol: 'GBPUSD',
      volume: 0.07, stopLoss: 2.0, takeProfit: 0.9, comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createLimitBuyOrder}
   */
  it('should create limit buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createLimitBuyOrder('GBPUSD', 0.07, 1.0, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.0, stopLoss: 0.9, takeProfit: 2.0, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createLimitSellOrder}
   */
  it('should create limit sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createLimitSellOrder('GBPUSD', 0.07, 1.5, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.5, stopLoss: 2.0, takeProfit: 0.9, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createStopBuyOrder}
   */
  it('should create stop buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopBuyOrder('GBPUSD', 0.07, 1.5, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY_STOP',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.5, stopLoss: 0.9, takeProfit: 2.0, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createStopSellOrder}
   */
  it('should create stop sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopSellOrder('GBPUSD', 0.07, 1.0, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL_STOP',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.0, stopLoss: 2.0, takeProfit: 0.9, comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createStopLimitBuyOrder}
   */
  it('should create stop limit buy order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: 46870472
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopLimitBuyOrder('GBPUSD', 0.07, 1.5, 1.4, 0.9, 2.0, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_BUY_STOP_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.5, stopLimitPrice: 1.4, stopLoss: 0.9, takeProfit: 2.0,
      comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#createStopLimitSellOrder}
   */
  it('should create stop limit sell order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.createStopLimitSellOrder('GBPUSD', 0.07, 1.0, 1.1, 2.0, 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_TYPE_SELL_STOP_LIMIT',
      symbol: 'GBPUSD', volume: 0.07, openPrice: 1.0, stopLimitPrice: 1.1, stopLoss: 2.0, takeProfit: 0.9,
      comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#modifyPosition}
   */
  it('should modify position', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.modifyPosition('46870472', 2.0, 0.9);
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_MODIFY',
      positionId: '46870472', stopLoss: 2.0, takeProfit: 0.9}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#closePositionPartially}
   */
  it('should close position partially', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closePositionPartially('46870472', 0.9, {comment: 'comment',
      clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_PARTIAL',
      positionId: '46870472', volume: 0.9, comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#closePosition}
   */
  it('should close position', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closePosition('46870472', {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_CLOSE_ID',
      positionId: '46870472', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#closeBy}
   */
  it('should close position by an opposite one', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472',
      closeByPositionId: '46870482'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closeBy('46870472', '46870482', {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITION_CLOSE_BY',
      positionId: '46870472', closeByPositionId: '46870482', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}),
    'RPC');
  });

  /**
   * @test {MetaApiConnection#closePositionsBySymbol}
   */
  it('should close positions by symbol', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      positionId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.closePositionsBySymbol('EURUSD', {comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'});
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'POSITIONS_CLOSE_SYMBOL',
      symbol: 'EURUSD', comment: 'comment', clientId: 'TE_GBPUSD_7hyINWqAlE'}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#modifyOrder}
   */
  it('should modify order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.modifyOrder('46870472', 1.0, 2.0, 0.9);
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_MODIFY', orderId: '46870472',
      openPrice: 1.0, stopLoss: 2.0, takeProfit: 0.9}), 'RPC');
  });

  /**
   * @test {MetaApiConnection#cancelOrder}
   */
  it('should cancel order', async () => {
    await api.connect();
    let tradeResult = {
      error: 10009,
      description: 'TRADE_RETCODE_DONE',
      orderId: '46870472'
    };
    sandbox.stub(client, 'trade').resolves(tradeResult);
    let actual = await api.cancelOrder('46870472');
    actual.should.match(tradeResult);
    sinon.assert.calledWith(client.trade, 'accountId', sinon.match({actionType: 'ORDER_CANCEL', orderId: '46870472'}),
      'RPC');
  });

  /**
   * @test {MetaApiConnection#calculateMargin}
   */
  it('should calculate margin', async () => {
    await api.connect();
    let margin = {
      margin: 110
    };
    let order = {
      symbol: 'EURUSD',
      type: 'ORDER_TYPE_BUY',
      volume: 0.1,
      openPrice: 1.1
    };
    sandbox.stub(client, 'calculateMargin').resolves(margin);
    let actual = await api.calculateMargin(order);
    actual.should.match(margin);
    sinon.assert.calledWith(client.calculateMargin, 'accountId', 'RPC', undefined, sinon.match(order));
  });

  /**
   * @test {MetaApiConnection#getSymbols}
   */
  it('should retrieve symbols', async () => {
    await api.connect();
    let symbols = ['EURUSD'];
    sandbox.stub(client, 'getSymbols').resolves(symbols);
    let actual = await api.getSymbols();
    actual.should.match(symbols);
    sinon.assert.calledWith(client.getSymbols, 'accountId');
  });

  /**
   * @test {MetaApiConnection#getSymbolSpecification}
   */
  it('should retrieve symbol specification', async () => {
    await api.connect();
    let specification = {
      symbol: 'AUDNZD',
      tickSize: 0.00001,
      minVolume: 0.01,
      maxVolume: 100,
      volumeStep: 0.01
    };
    sandbox.stub(client, 'getSymbolSpecification').resolves(specification);
    let actual = await api.getSymbolSpecification('AUDNZD');
    actual.should.match(specification);
    sinon.assert.calledWith(client.getSymbolSpecification, 'accountId', 'AUDNZD');
  });

  /**
   * @test {MetaApiConnection#getSymbolPrice}
   */
  it('should retrieve symbol price', async () => {
    await api.connect();
    let price = {
      symbol: 'AUDNZD',
      bid: 1.05297,
      ask: 1.05309,
      profitTickValue: 0.59731,
      lossTickValue: 0.59736
    };
    sandbox.stub(client, 'getSymbolPrice').resolves(price);
    let actual = await api.getSymbolPrice('AUDNZD', true);
    actual.should.match(price);
    sinon.assert.calledWith(client.getSymbolPrice, 'accountId', 'AUDNZD', true);
  });

  /**
   * @test {MetaApiConnection#getCandle}
   */
  it('should retrieve current candle', async () => {
    await api.connect();
    let candle = {
      symbol: 'AUDNZD',
      timeframe: '15m',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      open: 1.03297,
      high: 1.06309,
      low: 1.02705,
      close: 1.043,
      tickVolume: 1435,
      spread: 17,
      volume: 345
    };
    sandbox.stub(client, 'getCandle').resolves(candle);
    let actual = await api.getCandle('AUDNZD', '15m', true);
    actual.should.match(candle);
    sinon.assert.calledWith(client.getCandle, 'accountId', 'AUDNZD', '15m', true);
  });

  /**
   * @test {MetaApiConnection#getTick}
   */
  it('should retrieve latest tick', async () => {
    await api.connect();
    let tick = {
      symbol: 'AUDNZD',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      bid: 1.05297,
      ask: 1.05309,
      last: 0.5298,
      volume: 0.13,
      side: 'buy'
    };
    sandbox.stub(client, 'getTick').resolves(tick);
    let actual = await api.getTick('AUDNZD', true);
    actual.should.match(tick);
    sinon.assert.calledWith(client.getTick, 'accountId', 'AUDNZD', true);
  });

  /**
   * @test {MetaApiConnection#getBook}
   */
  it('should retrieve latest order book', async () => {
    await api.connect();
    let book = {
      symbol: 'AUDNZD',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      book: [
        {
          type: 'BOOK_TYPE_SELL',
          price: 1.05309,
          volume: 5.67
        },
        {
          type: 'BOOK_TYPE_BUY',
          price: 1.05297,
          volume: 3.45
        }
      ]
    };
    sandbox.stub(client, 'getBook').resolves(book);
    let actual = await api.getBook('AUDNZD', true);
    actual.should.match(book);
    sinon.assert.calledWith(client.getBook, 'accountId', 'AUDNZD', true);
  });

  /**
   * @test {MetaApiConnection#getServerTime}
   */
  it('should retrieve latest server time', async () => {
    await api.connect();
    let serverTime = {
      time: new Date('2022-01-01T00:00:00.000Z'),
      brokerTime: '2022-01-01 02:00:00.000Z'
    };
    sandbox.stub(client, 'getServerTime').resolves(serverTime);
    let actual = await api.getServerTime();
    actual.should.match(serverTime);
    sinon.assert.calledWith(client.getServerTime, 'accountId');
  });

});
