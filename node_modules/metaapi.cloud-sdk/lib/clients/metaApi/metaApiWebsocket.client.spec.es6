'use strict';

import should from 'should';
import sinon from 'sinon';
import MetaApiWebsocketClient from './metaApiWebsocket.client';
import Server from 'socket.io';
import NotConnectedError from './notConnectedError';
import {InternalError} from '../errorHandler';

/**
 * @test {MetaApiWebsocketClient}
 */
// eslint-disable-next-line max-statements
describe('MetaApiWebsocketClient', () => {

  let io;
  let server;
  let server1;
  let serverNewYork;
  let clock;
  let client;
  let sandbox;
  let activeSynchronizationIdsStub;
  let getActiveInstancesStub;
  const synchronizationThrottler = {
    activeSynchronizationIds: ['synchronizationId'],
    onDisconnect: () => {},
    updateSynchronizationId: () => {},
    removeSynchronizationId: () => {}
  };
  const domainClient = {
    getSettings: () => {}
  };
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

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    client = new MetaApiWebsocketClient(domainClient, 'token', {application: 'application', 
      domain: 'project-stock.agiliumlabs.cloud', requestTimeout: 1.5, useSharedClientApi: true,
      retryOpts: {retries: 3, minDelayInSeconds: 0.1, maxDelayInSeconds: 0.5}});
    client.url = 'http://localhost:6784';
    client._socketInstances = {'vint-hill': {0: [], 1: []}, 'new-york': {0: []}};
    io = new Server(6784, {path: '/ws', pingTimeout: 1000000});
    io.on('connect', socket => {
      server = socket;
      if (socket.request._query['auth-token'] !== 'token') {
        socket.emit({error: 'UnauthorizedError', message: 'Authorization token invalid'});
        socket.close();
      }
    });
    client._regionsByAccounts.accountId = {region: 'vint-hill', connections: 1};
    client._regionsByAccounts.accountIdReplica = {region: 'new-york', connections: 1};
    client._socketInstancesByAccounts = {0: {accountId: 0, accountIdReplica: 0}, 1: {accountId: 0}};
    client._accountsByReplicaId.accountId = 'accountId';
    client._accountsByReplicaId.accountIdReplica = 'accountId';
    client._accountReplicas.accountId = {
      'vint-hill': 'accountId',
      'new-york': 'accountIdReplica'
    };
    client._connectedHosts = {
      'accountId:vint-hill:0:ps-mpa-1': 'ps-mpa-1',
      'accountId:new-york:0:ps-mpa-2': 'ps-mpa-2'
    };
    await client.connect(0, 'new-york');
    serverNewYork = server;
    await client.connect(1, 'vint-hill');
    server1 = server;
    server1.on('request', async data => {
      if (data.type === 'unsubscribe' && data.accountId === 'accountId') {
        server1.emit('response', {requestId: data.requestId, type: 'response', accountId: 'accountId'});
      }
    });
    await client.connect(0, 'vint-hill');
    activeSynchronizationIdsStub = sandbox.stub(client._socketInstances['vint-hill'][0][0].synchronizationThrottler,
      'activeSynchronizationIds').get(() => []);
    sandbox.stub(client._socketInstances['vint-hill'][1][0].synchronizationThrottler, 
      'activeSynchronizationIds').get(() => []);

    sandbox.stub(client._latencyService, 'onConnected').returns();
    sandbox.stub(client._latencyService, 'onDisconnected').returns();
    sandbox.stub(client._latencyService, 'onUnsubscribe').returns();
    sandbox.stub(client._latencyService, 'onDealsSynchronized').returns();
    getActiveInstancesStub = sandbox.stub(client._latencyService, 'getActiveAccountInstances').returns([]);
  });

  afterEach(async () => {
    clock.restore();
    sandbox.restore();
    let resolve;
    let promise = new Promise(res => resolve = res);
    client.close();
    io.close(() => resolve());
    await promise;
  });

  /**
   * @test {MetaApiWebsocketClient#_tryReconnect}
   */
  it('should change client id on reconnect', async () => {
    client.close();
    let clientId;
    let connectAmount = 0;
    io.on('connect', socket => {
      connectAmount++;
      socket.request.headers['client-id'].should.equal(socket.request._query.clientId);
      socket.request.headers['client-id'].should.not.equal(clientId);
      socket.request._query.clientId.should.not.equal(clientId);
      clientId = socket.request._query.clientId;
      socket.disconnect();
    });
    await client.connect(0, 'vint-hill');
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(1500);
    await new Promise(res => setTimeout(res, 50));
    connectAmount.should.be.aboveOrEqual(2);
  });

  /**
   * @test {MetaApiWebsocketClient#connect}
   */
  it('should retry connection if first attempt timed out', async () => {
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
    let resolve;
    let promise = new Promise(res => resolve = res);
    client.close();
    io.close(() => resolve());
    await promise;
    client = new MetaApiWebsocketClient(domainClient, 'token', {application: 'application', 
      domain: 'project-stock.agiliumlabs.cloud', requestTimeout: 1.5, useSharedClientApi: false,
      connectTimeout: 0.1,
      retryOpts: { retries: 3, minDelayInSeconds: 0.1, maxDelayInSeconds: 0.5}});
    client.url = 'http://localhost:6785';
    (async () => {
      await new Promise(res => setTimeout(res, 200));
      io = new Server(6785, {path: '/ws', pingTimeout: 30000});
      io.on('connect', socket => {
        server = socket;
        server.on('request', data => {
          if (data.type === 'getPositions' && data.accountId === 'accountId' && data.application === 'RPC') {
            server.emit('response', {type: 'response', accountId: data.accountId, 
              requestId: data.requestId, positions});
          }
        });
      });
    })();
    let actual = await client.getPositions('accountId');
    actual.should.match(positions);
    io.close();
  });

  /**
   * @test {MetaApiWebsocketClient#_getServerUrl}
   */
  it('should connect to shared server', async () => {
    client.close();
    sandbox.stub(domainClient, 'getSettings').resolves({
      domain: 'v3.agiliumlabs.cloud'
    });
    client = new MetaApiWebsocketClient(domainClient, 'token', {application: 'application',
      domain: 'project-stock.agiliumlabs.cloud', requestTimeout: 1.5, useSharedClientApi: true});
    client._socketInstances = {'vint-hill': {0: [{
      connected: true,
      requestResolves: [],
      socket: {close: () => {}}
    }]}};
    const url = await client._getServerUrl(0, 0, 'vint-hill');
    should(url).eql('https://mt-client-api-v1.vint-hill-a.v3.agiliumlabs.cloud');
  });

  /**
   * @test {MetaApiWebsocketClient#_getServerUrl}
   */
  it('should connect to dedicated server', async () => {
    client.close();
    sandbox.stub(domainClient, 'getSettings').resolves({
      hostname: 'mt-client-api-dedicated',
      domain: 'project-stock.agiliumlabs.cloud'
    });
    client = new MetaApiWebsocketClient(domainClient, 'token', {application: 'application', 
      domain: 'project-stock.agiliumlabs.cloud', requestTimeout: 1.5, useSharedClientApi: true});
    client._socketInstances = {'vint-hill': {0: [{
      connected: true,
      requestResolves: [],
      socket: {close: () => {}}
    }]}};
    const url = await client._getServerUrl(0, 0, 'vint-hill');
    should(url).eql('https://mt-client-api-v1.vint-hill-a.project-stock.agiliumlabs.cloud');
  });

  /**
   * @test {MetaApiWebsocketClient#addAccountCache}
   */
  it('should add account cache', async () => {
    client.addAccountCache('accountId2', {'vint-hill': 'accountId2'});
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    sinon.assert.match(client.accountReplicas.accountId2, {'vint-hill': 'accountId2'});
    sinon.assert.match(client.accountsByReplicaId.accountId2, 'accountId2');
    client.addAccountCache('accountId2', {'vint-hill': 'accountId2'});
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    client.removeAccountCache('accountId2');
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    client.removeAccountCache('accountId2');
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    for (let i = 0; i < 5; i++) {
      await clock.tickAsync(30 * 60 * 1000 + 500);
    }
    sinon.assert.match(client.getAccountRegion('accountId2'), undefined);
    sinon.assert.match(client.accountReplicas.accountId2, undefined);
    sinon.assert.match(client.accountsByReplicaId.accountId2, undefined);
  });

  /**
   * @test {MetaApiWebsocketClient#addAccountCache}
   */
  it('should delay region deletion if a request is made', async () => {
    server.on('request', data => {
      if (data.type === 'getAccountInformation' && data.accountId === 'accountId2' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId,
          accountInformation
        });
      }
    });

    client.addAccountCache('accountId2', {'vint-hill': 'accountId2'});
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    await client.getAccountInformation('accountId2');
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    await clock.tickAsync(30 * 60 * 1000 + 500);
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    await client.getAccountInformation('accountId2');
    client.removeAccountCache('accountId2');
    await clock.tickAsync(30 * 60 * 1000 + 500);
    await client.getAccountInformation('accountId2');
    await clock.tickAsync(30 * 60 * 1000 + 500);
    sinon.assert.match(client.getAccountRegion('accountId2'), 'vint-hill');
    for (let i = 0; i < 5; i++) {
      await clock.tickAsync(30 * 60 * 1000 + 500);
    }
    sinon.assert.match(client.getAccountRegion('accountId2'), undefined);
  }).timeout(3000);

  /**
   * @test {MetaApiWebsocketClient#getAccountInformation}
   */
  it('should retrieve MetaTrader account information from API', async () => {
    server.on('request', data => {
      if (data.type === 'getAccountInformation' && data.accountId === 'accountId' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId,
          accountInformation
        });
      }
    });
    let actual = await client.getAccountInformation('accountId');
    actual.should.match(accountInformation);
  });

  /**
   * @test {MetaApiWebsocketClient#getPositions}
   */
  it('should retrieve MetaTrader positions from API', async () => {
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
    server.on('request', data => {
      if (data.type === 'getPositions' && data.accountId === 'accountId' && data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, positions});
      }
    });
    let actual = await client.getPositions('accountId');
    actual.should.match(positions);
  });

  /**
   * @test {MetaApiWebsocketClient#getPosition}
   */
  it('should retrieve MetaTrader position from API by id', async () => {
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
    server.on('request', data => {
      if (data.type === 'getPosition' && data.accountId === 'accountId' && data.positionId === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, position});
      }
    });
    let actual = await client.getPosition('accountId', '46214692');
    actual.should.match(position);
  });

  /**
   * @test {MetaApiWebsocketClient#getOrders}
   */
  it('should retrieve MetaTrader orders from API', async () => {
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
    server.on('request', data => {
      if (data.type === 'getOrders' && data.accountId === 'accountId' && data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, orders});
      }
    });
    let actual = await client.getOrders('accountId');
    actual.should.match(orders);
  });

  /**
   * @test {MetaApiWebsocketClient#getOrder}
   */
  it('should retrieve MetaTrader order from API by id', async () => {
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
    server.on('request', data => {
      if (data.type === 'getOrder' && data.accountId === 'accountId' && data.orderId === '46871284' &&
        data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, order});
      }
    });
    let actual = await client.getOrder('accountId', '46871284');
    actual.should.match(order);
  });

  /**
   * @test {MetaApiWebsocketClient#getHistoryOrdersByTicket}
   */
  it('should retrieve MetaTrader history orders from API by ticket', async () => {
    let historyOrders = [{
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
    }];
    server.on('request', data => {
      if (data.type === 'getHistoryOrdersByTicket' && data.accountId === 'accountId' && data.ticket === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, historyOrders,
          synchronizing: false
        });
      }
    });
    let actual = await client.getHistoryOrdersByTicket('accountId', '46214692');
    actual.should.match({historyOrders, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getHistoryOrdersByPosition}
   */
  it('should retrieve MetaTrader history orders from API by position', async () => {
    let historyOrders = [{
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
    }];
    server.on('request', data => {
      if (data.type === 'getHistoryOrdersByPosition' && data.accountId === 'accountId' &&
        data.positionId === '46214692' && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, historyOrders,
          synchronizing: false
        });
      }
    });
    let actual = await client.getHistoryOrdersByPosition('accountId', '46214692');
    actual.should.match({historyOrders, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getHistoryOrdersByTimeRange}
   */
  it('should retrieve MetaTrader history orders from API by time range', async () => {
    let historyOrders = [{
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
    }];
    server.on('request', data => {
      if (data.type === 'getHistoryOrdersByTimeRange' && data.accountId === 'accountId' &&
        data.startTime === '2020-04-15T02:45:00.000Z' && data.endTime === '2020-04-15T02:46:00.000Z' &&
        data.offset === 1 && data.limit === 100 && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, historyOrders,
          synchronizing: false
        });
      }
    });
    let actual = await client.getHistoryOrdersByTimeRange('accountId', new Date('2020-04-15T02:45:00.000Z'),
      new Date('2020-04-15T02:46:00.000Z'), 1, 100);
    actual.should.match({historyOrders, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getDealsByTicket}
   */
  it('should retrieve MetaTrader deals from API by ticket', async () => {
    let deals = [{
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
    }];
    server.on('request', data => {
      if (data.type === 'getDealsByTicket' && data.accountId === 'accountId' && data.ticket === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, deals,
          synchronizing: false
        });
      }
    });
    let actual = await client.getDealsByTicket('accountId', '46214692');
    actual.should.match({deals, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getDealsByPosition}
   */
  it('should retrieve MetaTrader deals from API by position', async () => {
    let deals = [{
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
    }];
    server.on('request', data => {
      if (data.type === 'getDealsByPosition' && data.accountId === 'accountId' && data.positionId === '46214692' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, deals,
          synchronizing: false
        });
      }
    });
    let actual = await client.getDealsByPosition('accountId', '46214692');
    actual.should.match({deals, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#getDealsByTimeRange}
   */
  it('should retrieve MetaTrader deals from API by time range', async () => {
    let deals = [{
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
    }];
    server.on('request', data => {
      if (data.type === 'getDealsByTimeRange' && data.accountId === 'accountId' &&
        data.startTime === '2020-04-15T02:45:00.000Z' && data.endTime === '2020-04-15T02:46:00.000Z' &&
        data.offset === 1 && data.limit === 100 && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, deals,
          synchronizing: false
        });
      }
    });
    let actual = await client.getDealsByTimeRange('accountId', new Date('2020-04-15T02:45:00.000Z'),
      new Date('2020-04-15T02:46:00.000Z'), 1, 100);
    actual.should.match({deals, synchronizing: false});
  });

  /**
   * @test {MetaApiWebsocketClient#removeApplication}
   */
  it('should remove application from API', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'removeApplication' && data.accountId === 'accountId' && data.application === 'application') {
        requestReceived = true;
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
      }
    });
    await client.removeApplication('accountId');
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#trade}
   */
  it('should execute a trade via new API version', async () => {
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      numericCode: 10009,
      stringCode: 'TRADE_RETCODE_DONE',
      message: 'Request completed',
      orderId: '46870472'
    };
    sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
      instanceIndex: 0, replicas: 1});
    await new Promise(res => setTimeout(res, 100));
    let instanceIndex;
    server.on('request', data => {
      instanceIndex = data.instanceIndex;
      data.trade.should.match(trade);
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
    });
    let actual = await client.trade('accountId', trade);
    actual.should.match(response);
    should.equal(instanceIndex, 0);
  });

  /**
   * @test {MetaApiWebsocketClient#trade}
   */
  it('should execute a trade via a replica account', async () => {
    getActiveInstancesStub.returns(['accountId:new-york:0:ps-mpa-2']);
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      numericCode: 10009,
      stringCode: 'TRADE_RETCODE_DONE',
      message: 'Request completed',
      orderId: '46870472'
    };
    sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    serverNewYork.emit('synchronization', {type: 'authenticated', accountId: 'accountIdReplica', host: 'ps-mpa-2',
      instanceIndex: 0, replicas: 1});
    await new Promise(res => setTimeout(res, 100));
    let instanceIndex;
    serverNewYork.on('request', data => {
      instanceIndex = data.instanceIndex;
      data.trade.should.match(trade);
      if (data.type === 'trade' && data.accountId === 'accountIdReplica' && data.application === 'application') {
        serverNewYork.emit('response', {type: 'response', accountId: data.accountId, 
          requestId: data.requestId, response});
      }
    });
    let actual = await client.trade('accountId', trade);
    actual.should.match(response);
    should.equal(instanceIndex, 0);
  });

  /**
   * @test {MetaApiWebsocketClient#trade}
   */
  it('should execute an RPC trade', async () => {
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      numericCode: 10009,
      stringCode: 'TRADE_RETCODE_DONE',
      message: 'Request completed',
      orderId: '46870472'
    };
    sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
      instanceIndex: 0, replicas: 1});
    await new Promise(res => setTimeout(res, 50));
    let instanceIndex;
    server.on('request', data => {
      instanceIndex = data.instanceIndex;
      data.trade.should.match(trade);
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'RPC') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
    });
    let actual = await client.trade('accountId', trade, 'RPC');
    actual.should.match(response);
    should.not.exist(instanceIndex);
  });

  /**
   * @test {MetaApiWebsocketClient#trade}
   */
  it('should execute a trade via API and receive trade error from old API version', async () => {
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      error: 10006,
      description: 'TRADE_RETCODE_REJECT',
      message: 'Request rejected',
      orderId: '46870472'
    };
    server.on('request', data => {
      data.trade.should.match(trade);
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
    });
    try {
      await client.trade('accountId', trade);
      should.fail('Trade error expected');
    } catch (err) {
      err.message.should.equal('Request rejected');
      err.name.should.equal('TradeError');
      err.stringCode.should.equal('TRADE_RETCODE_REJECT');
      err.numericCode.should.equal(10006);
    }
  });

  /**
   * @test {MetaApiWebsocketClient#subscribe}
   */
  it('should connect to MetaTrader terminal', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'subscribe' && data.accountId === 'accountId' && data.application === 'application' &&
        data.instanceIndex === 0) {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        requestReceived = true;
      }
    });
    await client.subscribe('accountId', 0);
    await new Promise(res => setTimeout(res, 50));
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#subscribe}
   */
  it('should connect to MetaTrader terminal via a replica even if synced main', async () => {
    getActiveInstancesStub.returns(['accountId:vint-hill:0:ps-mpa-1']);
    let requestReceived = false;
    serverNewYork.on('request', data => {
      if (data.type === 'subscribe' && data.accountId === 'accountIdReplica' && data.application === 'application' &&
        data.instanceIndex === 0) {
        serverNewYork.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        requestReceived = true;
      }
    });
    await client.subscribe('accountIdReplica', 0);
    await new Promise(res => setTimeout(res, 50));
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#subscribe}
   */
  it('should create new instance when account limit is reached', async () => {
    sinon.assert.match(client.socketInstances['vint-hill'][0].length, 1);
    for (let i = 0; i < 100; i++) {
      client._socketInstancesByAccounts[0]['accountId' + i] = 0;
      client._regionsByAccounts['accountId' + i] = {region: 'vint-hill', connections: 1};
    }

    io.removeAllListeners('connect');
    io.on('connect', socket => {
      socket.on('request', data => {
        if (data.type === 'subscribe' && data.accountId === 'accountId101' && data.application === 'application' &&
          data.instanceIndex === 0) {
          socket.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
    });
    client._regionsByAccounts.accountId101 = {region: 'vint-hill', connections: 1};
    await client.subscribe('accountId101', 0);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.match(client.socketInstances['vint-hill'][0].length, 2);
  });

  /**
   * @test {MetaApiWebsocketClient#subscribe}
   */
  it('should return error if connect to MetaTrader terminal failed', async () => {
    let requestReceived = false;
    server.on('request', data => {
      if (data.type === 'subscribe' && data.accountId === 'accountId' && data.application === 'application') {
        requestReceived = true;
      }
      server.emit('processingError', {
        id: 1, error: 'NotAuthenticatedError', message: 'Error message',
        requestId: data.requestId
      });
    });
    let success = true;
    try {
      await client.subscribe('accountId', 0);
      success = false;
    } catch (err) {
      err.name.should.equal('NotConnectedError');
    }
    success.should.be.true();
    requestReceived.should.be.true();
  });

  /**
   * @test {MetaApiWebsocketClient#getSymbols}
   */
  it('should retrieve symbols from API', async () => {
    let symbols = ['EURUSD'];
    server.on('request', data => {
      if (data.type === 'getSymbols' && data.accountId === 'accountId' && data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId, symbols
        });
      }
    });
    let actual = await client.getSymbols('accountId');
    actual.should.match(symbols);
  });

  /**
   * @test {MetaApiWebsocketClient#getSymbolSpecification}
   */
  it('should retrieve symbol specification from API', async () => {
    let specification = {
      symbol: 'AUDNZD',
      tickSize: 0.00001,
      minVolume: 0.01,
      maxVolume: 100,
      volumeStep: 0.01
    };
    server.on('request', data => {
      if (data.type === 'getSymbolSpecification' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC') {
        server.emit('response', {
          type: 'response', accountId: data.accountId, requestId: data.requestId,
          specification
        });
      }
    });
    let actual = await client.getSymbolSpecification('accountId', 'AUDNZD');
    actual.should.match(specification);
  });

  /**
   * @test {MetaApiWebsocketClient#getSymbolPrice}
   */
  it('should retrieve symbol price from API', async () => {
    let price = {
      symbol: 'AUDNZD',
      bid: 1.05297,
      ask: 1.05309,
      profitTickValue: 0.59731,
      lossTickValue: 0.59736
    };
    server.on('request', data => {
      if (data.type === 'getSymbolPrice' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC' && data.keepSubscription === true) {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, price});
      }
    });
    let actual = await client.getSymbolPrice('accountId', 'AUDNZD', true);
    actual.should.match(price);
  });

  /**
   * @test {MetaApiWebsocketClient#getCandle}
   */
  it('should retrieve candle from API', async () => {
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
    server.on('request', data => {
      if (data.type === 'getCandle' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC' && data.timeframe === '15m' && data.keepSubscription === true) {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, candle});
      }
    });
    let actual = await client.getCandle('accountId', 'AUDNZD', '15m', true);
    actual.should.match(candle);
  });

  /**
   * @test {MetaApiWebsocketClient#getTick}
   */
  it('should retrieve latest tick from API', async () => {
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
    server.on('request', data => {
      if (data.type === 'getTick' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC' && data.keepSubscription === true) {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, tick});
      }
    });
    let actual = await client.getTick('accountId', 'AUDNZD', true);
    actual.should.match(tick);
  });

  /**
   * @test {MetaApiWebsocketClient#getBook}
   */
  it('should retrieve latest order book from API', async () => {
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
    server.on('request', data => {
      if (data.type === 'getBook' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
        data.application === 'RPC' && data.keepSubscription === true) {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, book});
      }
    });
    let actual = await client.getBook('accountId', 'AUDNZD', true);
    actual.should.match(book);
  });

  /**
   * @test {MetaApiWebsocketClient#sendUptime}
   */
  it('should sent uptime stats to the server', async () => {
    server.on('request', data => {
      if (data.type === 'saveUptime' && data.accountId === 'accountId' &&
        JSON.stringify(data.uptime) === JSON.stringify({'1h': 100}) &&
        data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
      }
    });
    await client.saveUptime('accountId', {'1h': 100});
  });

  /**
   * @test {MetaApiWebsocketClient#unsubscribe}
   */
  describe('unsubscription', () => {

    /**
     * @test {MetaApiWebsocketClient#unsubscribe}
     */
    it('should unsubscribe from account data', async () => {
      let requestReceived = false;

      let response = {type: 'response', accountId: 'accountId'};
      server.on('request', data => {
        if (data.type === 'unsubscribe' && data.accountId === 'accountId') {
          requestReceived = true;
          server.emit('response', Object.assign({requestId: data.requestId}, response));
        }
      });
      await client.unsubscribe('accountId');
      sinon.assert.match(requestReceived, true);
      client.socketInstancesByAccounts.should.not.have.property('accountId');
      sinon.assert.calledWith(client._latencyService.onUnsubscribe, 'accountId');
    });

    /**
     * @test {MetaApiWebsocketClient#unsubscribe}
     */
    it('should ignore not found exception on unsubscribe', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'ValidationError', message: 'Validation failed',
          details: [{parameter: 'volume', message: 'Required value.'}], requestId: data.requestId
        });
      });
      try {
        await client.unsubscribe('accountId');
        throw new Error('ValidationError extected');
      } catch (err) {
        err.name.should.equal('ValidationError');
        err.details.should.match([{
          parameter: 'volume',
          message: 'Required value.'
        }]);
      }
      server.removeAllListeners('request');
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotFoundError', message: 'Account not found', requestId: data.requestId
        });
      });
      server1.on('request', data => {
        server1.emit('processingError', {
          id: 1, error: 'NotFoundError', message: 'Account not found', requestId: data.requestId
        });
      });
      await client.unsubscribe('accountId');
    });

    /**
     * @test {MetaApiWebsocketClient#unsubscribe}
     */
    it('should ignore timeout error on unsubscribe', async () => {
      let promise = client.unsubscribe('accountId').catch(() => {});
      await clock.tickAsync(15000);
      await promise;
    }).timeout(20000);

    /**
     * @test {MetaApiWebsocketClient#unsubscribe}
     */
    it('should repeat unsubscription on synchronization packets if account must be unsubscribed', async () => {
      let prices = [{
        symbol: 'AUDNZD',
        bid: 1.05916,
        ask: 1.05927,
        profitTickValue: 0.602,
        lossTickValue: 0.60203
      }];
      let subscribeServerHandler = sandbox.stub();
      let unsubscribeServerHandler = sandbox.stub();
      server.on('request', data => {
        let serverHandler;
        if (data.type === 'subscribe' && data.accountId === 'accountId') {
          serverHandler = subscribeServerHandler;
        } else if (data.type === 'unsubscribe' && data.accountId === 'accountId') {
          serverHandler = unsubscribeServerHandler;
        }
        if (serverHandler) {
          serverHandler();
          let response = {type: 'response', accountId: 'accountId'};
          server.emit('response', Object.assign({requestId: data.requestId}, response));
        }
      });
      // Subscribing
      await client.subscribe('accountId', 0);
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledOnce(subscribeServerHandler);
      // Unsubscribing
      await client.unsubscribe('accountId');
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledOnce(unsubscribeServerHandler);
      // Sending a packet, should throttle first repeat unsubscribe request
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, prices });
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledOnce(unsubscribeServerHandler);
      // Repeat a packet after a while, should unsubscribe again
      await clock.tickAsync(11000);
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, prices });
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledTwice(unsubscribeServerHandler);
      // Repeat a packet, should throttle unsubscribe request
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, prices });
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledTwice(unsubscribeServerHandler);
      // Repeat a packet after a while, should not throttle unsubscribe request
      await clock.tickAsync(11000);
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, prices });
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledThrice(unsubscribeServerHandler);
    });

  });

  describe('error handling', () => {

    /**
     * @test {MetaApiWebsocketClient#trade}
     */
    it('should handle ValidationError', async () => {
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD'
      };
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'ValidationError', message: 'Validation failed',
          details: [{parameter: 'volume', message: 'Required value.'}], requestId: data.requestId
        });
      });
      try {
        await client.trade('accountId', trade);
        throw new Error('ValidationError extected');
      } catch (err) {
        err.name.should.equal('ValidationError');
        err.details.should.match([{
          parameter: 'volume',
          message: 'Required value.'
        }]);
      }
    });

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle NotFoundError', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotFoundError', message: 'Position id 1234 not found',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('NotFoundError extected');
      } catch (err) {
        err.name.should.equal('NotFoundError');
      }
    });

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle NotSynchronizedError', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotSynchronizedError', message: 'Error message',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('NotSynchronizedError extected');
      } catch (err) {
        err.name.should.equal('NotSynchronizedError');
      }
    }).timeout(8000);

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle NotConnectedError', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'NotAuthenticatedError', message: 'Error message',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('NotConnectedError extected');
      } catch (err) {
        err.name.should.equal('NotConnectedError');
      }
    });

    /**
     * @test {MetaApiWebsocketClient#getPosition}
     */
    it('should handle other errors', async () => {
      server.on('request', data => {
        server.emit('processingError', {
          id: 1, error: 'Error', message: 'Error message',
          requestId: data.requestId
        });
      });
      try {
        await client.getPosition('accountId', '1234');
        throw new Error('InternalError extected');
      } catch (err) {
        err.name.should.equal('InternalError');
      }
    }).timeout(8000);

  });

  describe('connection status synchronization', () => {

    let sessionId;

    beforeEach(() => {
      sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
      sessionId = client.socketInstances['vint-hill'][0].sessionId;
      client._socketInstancesByAccounts = {0: {accountId: 0}, 1: {accountId: 0}};
    });

    afterEach(() => {
      client.removeAllListeners();
    });

    it('should process authenticated synchronization event', async () => {
      let listener = {
        onConnected: () => {
        }
      };
      sandbox.stub(listener, 'onConnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onConnected, 'vint-hill:0:ps-mpa-1', 2);
      sinon.assert.calledWith(client._latencyService.onConnected, 'accountId:vint-hill:0:ps-mpa-1');
    });

    it('should send trade requests to both instances', async () => {
      let listener = {
        onConnected: () => {
        }
      };
      let instanceCalled0 = false;
      let instanceCalled1 = false;
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD',
        volume: 0.07
      };
      let response = {
        numericCode: 10009,
        stringCode: 'TRADE_RETCODE_DONE',
        message: 'Request completed',
        orderId: '46870472'
      };
      server.on('request', data => {
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          instanceCalled0 = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
        }
      });
      server1.on('request', data => {
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          instanceCalled1 = true;
          server1.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
        }
      });
      sandbox.stub(listener, 'onConnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      await client.trade('accountId', trade, undefined, 'high');
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.match(instanceCalled0, true);
      sinon.assert.match(instanceCalled1, true);
    });

    it('should not send requests to mismatching instances', async () => {
      let requestReceivedAssigned0 = false;
      let requestReceivedAssigned1 = false;
      server.on('request', data => {
        if (data.type === 'subscribe' && data.accountId === 'accountId' && data.application === 'application'
        && data.instanceIndex === 0) {
          requestReceivedAssigned0 = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      server1.on('request', data => {
        if (data.type === 'subscribe' && data.accountId === 'accountId' && data.application === 'application' 
        && data.instanceIndex === 1) {
          requestReceivedAssigned1 = true;
          server1.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.subscribe('accountId', 0);
      sinon.assert.match(requestReceivedAssigned0, true);
      await client.subscribe('accountId', 1);
      sinon.assert.match(requestReceivedAssigned1, true);

      let requestReceivedAuthenticated0 = false;
      let requestReceivedAuthenticated1 = false;
      server.on('request', data => {
        if (data.type === 'removeApplication' && data.accountId === 'accountId' && data.application === 'application'
        && data.instanceIndex === 0) {
          requestReceivedAuthenticated0 = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      server1.on('request', data => {
        if (data.type === 'removeApplication' && data.accountId === 'accountId' && data.application === 'application'
        && data.instanceIndex === 1) {
          requestReceivedAuthenticated1 = true;
          server1.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.removeApplication('accountId');
      sinon.assert.match(requestReceivedAuthenticated0, true);
      sinon.assert.match(requestReceivedAuthenticated1, false);

      requestReceivedAuthenticated0 = false;
      getActiveInstancesStub.returns(['accountId:vint-hill:1:ps-mpa-1']);
      await client.removeApplication('accountId');
      sinon.assert.match(requestReceivedAuthenticated0, false);
      sinon.assert.match(requestReceivedAuthenticated1, true);

      let listener = {
        onConnected: () => {
        }
      };
      let instanceCalledTrade0 = false;
      let instanceCalledTrade1 = false;
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD',
        volume: 0.07
      };
      let response = {
        numericCode: 10009,
        stringCode: 'TRADE_RETCODE_DONE',
        message: 'Request completed',
        orderId: '46870472'
      };
      server.on('request', data => {
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          instanceCalledTrade0 = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
        }
      });
      server1.on('request', data => {
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          instanceCalledTrade1 = true;
          server1.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
        }
      });
      getActiveInstancesStub.returns(['accountId:vint-hill:0:ps-mpa-1']);
      sandbox.stub(listener, 'onConnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      await client.trade('accountId', trade, undefined, 'regular');
      sinon.assert.match(instanceCalledTrade0, true);
      sinon.assert.match(instanceCalledTrade1, false);

      instanceCalledTrade0 = false;
      getActiveInstancesStub.returns(['accountId:vint-hill:1:ps-mpa-1']);
      await client.trade('accountId', trade, undefined, 'regular');
      sinon.assert.match(instanceCalledTrade0, false);
      sinon.assert.match(instanceCalledTrade1, true);
    });

    it('should process authenticated synchronization event with session id', async () => {
      let listener = {
        onConnected: () => {
        }
      };
      sandbox.stub(listener, 'onConnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-2',
        instanceIndex: 0, replicas: 1, sessionId: 'wrong'});
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2, sessionId });
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onConnected, 1);
      sinon.assert.calledWith(listener.onConnected, 'vint-hill:0:ps-mpa-1', 2);
    });

    it('should cancel subscribe on authenticated event', async () => {
      let listener = {
        onConnected: () => {}
      };
      sandbox.stub(listener, 'onConnected').resolves();
      const cancelSubscribeStub = sandbox.stub(client._subscriptionManager, 'cancelSubscribe');
      const cancelAccountStub = sandbox.stub(client._subscriptionManager, 'cancelAccount');
      client.addSynchronizationListener('accountId', listener);
      client._socketInstancesByAccounts[0].accountId2 = 0;
      client._socketInstancesByAccounts[1].accountId2 = 0;
      client._regionsByAccounts.accountId2 = {region: 'vint-hill', connections: 1};
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2, sessionId });
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId2', host: 'ps-mpa-2',
        instanceIndex: 0, replicas: 1, sessionId });
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(cancelSubscribeStub, 'accountId:0');
      sinon.assert.calledWith(cancelAccountStub, 'accountId2');
    });

    it('should process broker connection status event', async () => {
      let listener = {
        onConnected: () => {},
        onBrokerConnectionStatusChanged: () => {}
      };
      sandbox.stub(listener, 'onBrokerConnectionStatusChanged').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onBrokerConnectionStatusChanged, 'vint-hill:0:ps-mpa-1', true);
    });

    it('should call an onDisconnect if there was no signal for a long time', async () => {
      let listener = {
        onConnected: () => {},
        onDisconnected: () => {},
        onBrokerConnectionStatusChanged: () => {},
        onStreamClosed: () => {},
      };
      sandbox.stub(listener, 'onDisconnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(10000);
      await server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(55000);
      sinon.assert.notCalled(listener.onDisconnected);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(10000);
      sinon.assert.notCalled(listener.onDisconnected);
      await clock.tickAsync(55000);
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onDisconnected, 'vint-hill:0:ps-mpa-1');
      sinon.assert.calledWith(client._latencyService.onDisconnected, 'accountId:vint-hill:0:ps-mpa-1');
      await clock.tickAsync(10000);
      clock.restore();
    });

    it('should close stream on timeout if another stream exists', async () => {
      let listener = {
        onConnected: () => {},
        onDisconnected: () => {},
        onStreamClosed: () => {},
        onBrokerConnectionStatusChanged: () => {}
      };
      const onTimeoutStub = sandbox.stub(client._subscriptionManager, 'onTimeout').resolves();
      const onStreamClosedStub = sandbox.stub(listener, 'onStreamClosed').resolves();
      const onDisconnectedStub = sandbox.stub(listener, 'onDisconnected').resolves();
      sandbox.stub(client._subscriptionManager, 'onDisconnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(15000);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-2',
        instanceIndex: 0, replicas: 2});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 0});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-2', connected: true,
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(15000);
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 0});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-2', connected: true,
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(55000);
      sinon.assert.notCalled(onDisconnectedStub);
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        instanceIndex: 0});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-2', connected: true,
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(15000);
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-2', connected: true,
        instanceIndex: 0});
      sinon.assert.notCalled(onDisconnectedStub);
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(55000);
      sinon.assert.calledWith(onStreamClosedStub, 'vint-hill:0:ps-mpa-1');
      sinon.assert.notCalled(onDisconnectedStub);
      sinon.assert.notCalled(onTimeoutStub);
      await new Promise(res => setTimeout(res, 50));
      await clock.tickAsync(15000);
      sinon.assert.calledWith(onDisconnectedStub, 'vint-hill:0:ps-mpa-2');
      sinon.assert.notCalled(client._subscriptionManager.onDisconnected);
      sinon.assert.calledWith(onTimeoutStub, 'accountId', 0);
    });

    it('should process server-side health status event', async () => {
      let listener = {
        onConnected: () => {},
        onBrokerConnectionStatusChanged: () => {},
        onHealthStatus: () => {}
      };
      sandbox.stub(listener, 'onHealthStatus').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0});
      server.emit('synchronization', {type: 'status', accountId: 'accountId', host: 'ps-mpa-1', connected: true,
        healthStatus: {restApiHealthy: true}, instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onHealthStatus, 'vint-hill:0:ps-mpa-1', {restApiHealthy: true});
    });

    it('should process disconnected synchronization event', async () => {
      let listener = {
        onConnected: () => {},
        onDisconnected: () => {},
        onStreamClosed: () => {},
      };
      sandbox.stub(listener, 'onDisconnected').resolves();
      sandbox.stub(listener, 'onStreamClosed').resolves();
      sandbox.stub(client._subscriptionManager, 'onDisconnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0});
      server.emit('synchronization', {type: 'disconnected', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onDisconnected, 'vint-hill:0:ps-mpa-1');
      sinon.assert.calledWith(client._subscriptionManager.onDisconnected, 'accountId', 0);
      sinon.assert.calledWith(listener.onStreamClosed, 'vint-hill:0:ps-mpa-1');
    });

    it('should close the stream if host name disconnected and another stream exists', async () => {
      let listener = {
        onConnected: () => {},
        onDisconnected: () => {},
        onStreamClosed: () => {},
      };
      sandbox.stub(listener, 'onDisconnected').resolves();
      sandbox.stub(listener, 'onStreamClosed').resolves();
      const onDisconnectedStub = sandbox.stub(client._subscriptionManager, 'onDisconnected').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 2});
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-2',
        instanceIndex: 0, replicas: 2});
      server.emit('synchronization', {type: 'disconnected', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onStreamClosed, 'vint-hill:0:ps-mpa-1');
      sinon.assert.notCalled(listener.onDisconnected);
      sinon.assert.notCalled(onDisconnectedStub);
      server.emit('synchronization', {type: 'disconnected', accountId: 'accountId', host: 'ps-mpa-2',
        instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledOnce(listener.onDisconnected);
      sinon.assert.calledWith(onDisconnectedStub, 'accountId', 0);
    });
  });

  describe('terminal state synchronization', () => {

    beforeEach(() => {
      sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    });

    afterEach(() => {
      client.removeAllListeners();
    });

    it('should only accept packets with own synchronization ids', async () => {
      let listener = {
        onAccountInformationUpdated: () => {},
        onSynchronizationStarted: () => {}
      };
      sandbox.stub(listener, 'onAccountInformationUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      sandbox.stub(client._socketInstances['vint-hill'][0][0].synchronizationThrottler, 
        'activeSynchronizationIds').get(() => ['synchronizationId']);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation: {}, instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onAccountInformationUpdated, 1);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId',
        instanceIndex: 0, synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 50));
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId',
        accountInformation: {}, instanceIndex: 0, synchronizationId: 'wrong'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onAccountInformationUpdated, 1);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation: {}, instanceIndex: 0, synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.callCount(listener.onAccountInformationUpdated, 2);
    });

    /**
     * @test {MetaApiWebsocketClient#synchronize}
     */
    it('should synchronize with MetaTrader terminal', async () => {
      let requestReceived = false;
      // eslint-disable-next-line complexity
      server.on('request', data => {
        if (data.type === 'synchronize' && data.accountId === 'accountId' &&
          data.host === 'ps-mpa-1' &&
          data.startingHistoryOrderTime === '2020-01-01T00:00:00.000Z' &&
          data.startingDealTime === '2020-01-02T00:00:00.000Z' && data.requestId === 'synchronizationId' &&
          data.application === 'application' && data.instanceIndex === 0) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.synchronize('accountId', 0, 'ps-mpa-1', 'synchronizationId', new Date('2020-01-01T00:00:00.000Z'),
        new Date('2020-01-02T00:00:00.000Z'), () => ({
          specificationsMd5: '1111',
          positionsMd5: '2222',
          ordersMd5: '3333'
        }));
      requestReceived.should.be.true();
    });

    it('should process synchronization started event', async () => {
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      let listener = {
        onSynchronizationStarted: () => {},
        onPositionsSynchronized: () => {},
        onPendingOrdersSynchronized: () => {},
        onAccountInformationUpdated: () => {},
      };
      sandbox.stub(listener, 'onSynchronizationStarted').resolves();
      sandbox.stub(listener, 'onPositionsSynchronized').resolves();
      sandbox.stub(listener, 'onPendingOrdersSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation, instanceIndex: 0, host: 'ps-mpa-1', synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.calledWith(listener.onSynchronizationStarted, 'vint-hill:0:ps-mpa-1', true, true, true);
      sinon.assert.notCalled(listener.onPositionsSynchronized);
      sinon.assert.notCalled(listener.onPendingOrdersSynchronized);
    });

    it('should process synchronization started event with no updates', async () => {
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      let listener = {
        onSynchronizationStarted: () => {},
        onPositionsSynchronized: () => {},
        onPendingOrdersSynchronized: () => {},
        onAccountInformationUpdated: () => {},
      };
      sandbox.stub(listener, 'onSynchronizationStarted').resolves();
      sandbox.stub(listener, 'onPositionsSynchronized').resolves();
      sandbox.stub(listener, 'onPendingOrdersSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', instanceIndex: 0,
        specificationsUpdated: false, positionsUpdated: false, ordersUpdated: false,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation, instanceIndex: 0, host: 'ps-mpa-1', synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onSynchronizationStarted, 'vint-hill:0:ps-mpa-1', false, false, false);
      sinon.assert.calledWith(listener.onPositionsSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
      sinon.assert.calledWith(listener.onPendingOrdersSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
    });

    it('should process synchronization started event without updating positions', async () => {
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
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      let listener = {
        onSynchronizationStarted: () => {},
        onPositionsSynchronized: () => {},
        onPendingOrdersSynchronized: () => {},
        onPendingOrdersReplaced: () => {},
        onAccountInformationUpdated: () => {},
      };
      sandbox.stub(listener, 'onSynchronizationStarted').resolves();
      sandbox.stub(listener, 'onPositionsSynchronized').resolves();
      sandbox.stub(listener, 'onPendingOrdersSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1', positionsUpdated: false,
        ordersUpdated: true});
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation, instanceIndex: 0, host: 'ps-mpa-1', synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.calledWith(listener.onSynchronizationStarted, 'vint-hill:0:ps-mpa-1', true, false, true);
      sinon.assert.calledWith(listener.onPositionsSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
      sinon.assert.notCalled(listener.onPendingOrdersSynchronized);
      server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders, instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.calledWith(listener.onPendingOrdersSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
    });

    it('should process synchronization started event without updating orders', async () => {
      let positions = [{
        id: '46214692',
        type: 'POSITION_TYPE_BUY',
        symbol: 'GBPUSD',
        magic: 1000,
        time: '2020-04-15T02:45:06.521Z',
        updateTime: '2020-04-15T02:45:06.521Z',
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

      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      let listener = {
        onSynchronizationStarted: () => {},
        onPositionsSynchronized: () => {},
        onPendingOrdersSynchronized: () => {},
        onPositionsReplaced: () => {},
        onAccountInformationUpdated: () => {},
      };
      sandbox.stub(listener, 'onSynchronizationStarted').resolves();
      sandbox.stub(listener, 'onPositionsSynchronized').resolves();
      sandbox.stub(listener, 'onPendingOrdersSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1', positionsUpdated: true,
        ordersUpdated: false});
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId', 
        accountInformation, instanceIndex: 0, host: 'ps-mpa-1', synchronizationId: 'synchronizationId'});
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.calledWith(listener.onSynchronizationStarted, 'vint-hill:0:ps-mpa-1', true, true, false);
      sinon.assert.notCalled(listener.onPositionsSynchronized);
      sinon.assert.notCalled(listener.onPendingOrdersSynchronized);
      server.emit('synchronization', {type: 'positions', accountId: 'accountId', positions, instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onPositionsSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
      sinon.assert.calledWith(listener.onPendingOrdersSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
    });

    it('should synchronize account information', async () => {
      let listener = {
        onAccountInformationUpdated: () => {
        }
      };
      sandbox.stub(listener, 'onAccountInformationUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'accountInformation', accountId: 'accountId',
        host: 'ps-mpa-1', accountInformation, instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onAccountInformationUpdated, 'vint-hill:0:ps-mpa-1', accountInformation);
    });

    it('should synchronize positions', async () => {
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
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      let listener = {
        onPositionsReplaced: () => {},
        onPositionsSynchronized: () => {},
        onSynchronizationStarted: () => {}
      };
      sandbox.stub(listener, 'onPositionsReplaced').resolves();
      sandbox.stub(listener, 'onPositionsSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId',
        instanceIndex: 0, synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 50));
      server.emit('synchronization', {type: 'positions', accountId: 'accountId', positions, instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onPositionsReplaced, 'vint-hill:0:ps-mpa-1', positions);
      sinon.assert.calledWith(listener.onPositionsSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
    });

    it('should synchronize orders', async () => {
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
      let listener = {
        onPendingOrdersReplaced: () => {},
        onPendingOrdersSynchronized: () => {},
        onSynchronizationStarted: () => {}
      };
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      sandbox.stub(listener, 'onPendingOrdersReplaced').resolves();
      sandbox.stub(listener, 'onPendingOrdersSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId',
        instanceIndex: 0, synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 50));
      server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders, instanceIndex: 0,
        synchronizationId: 'synchronizationId', host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.calledWith(listener.onPendingOrdersReplaced, 'vint-hill:0:ps-mpa-1', orders);
      sinon.assert.calledWith(listener.onPendingOrdersSynchronized, 'vint-hill:0:ps-mpa-1', 'synchronizationId');
    });

    it('should synchronize history orders', async () => {
      let historyOrders = [{
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
      }];
      let listener = {
        onHistoryOrderAdded: () => {
        }
      };
      sandbox.stub(listener, 'onHistoryOrderAdded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'historyOrders', accountId: 'accountId', historyOrders,
        instanceIndex: 0, host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onHistoryOrderAdded, 'vint-hill:0:ps-mpa-1', historyOrders[0]);
    });

    it('should synchronize deals', async () => {
      let deals = [{
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
      }];
      let listener = {
        onDealAdded: () => {
        }
      };
      sandbox.stub(listener, 'onDealAdded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'deals', accountId: 'accountId', deals, instanceIndex: 0,
        host: 'ps-mpa-1'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onDealAdded, 'vint-hill:0:ps-mpa-1', deals[0]);
    });

    it('should process synchronization updates', async () => {
      let update = {
        accountInformation: {
          broker: 'True ECN Trading Ltd',
          currency: 'USD',
          server: 'ICMarketsSC-Demo',
          balance: 7319.9,
          equity: 7306.649913200001,
          margin: 184.1,
          freeMargin: 7120.22,
          leverage: 100,
          marginLevel: 3967.58283542
        },
        updatedPositions: [{
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
        }],
        removedPositionIds: ['1234'],
        updatedOrders: [{
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
        }],
        completedOrderIds: ['2345'],
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
        }]
      };
      let listener = {
        onAccountInformationUpdated: () => {},
        onPositionUpdated: () => {},
        onPositionRemoved: () => {},
        onPendingOrderUpdated: () => {},
        onPendingOrderCompleted: () => {},
        onHistoryOrderAdded: () => {},
        onDealAdded: () => {}
      };
      sandbox.stub(listener, 'onAccountInformationUpdated').resolves();
      sandbox.stub(listener, 'onPositionUpdated').resolves();
      sandbox.stub(listener, 'onPositionRemoved').resolves();
      sandbox.stub(listener, 'onPendingOrderUpdated').resolves();
      sandbox.stub(listener, 'onPendingOrderCompleted').resolves();
      sandbox.stub(listener, 'onHistoryOrderAdded').resolves();
      sandbox.stub(listener, 'onDealAdded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', Object.assign({type: 'update', accountId: 'accountId', instanceIndex: 0,
        host: 'ps-mpa-1'}, update));
      await new Promise(res => setTimeout(res, 100));
      sinon.assert.calledWith(listener.onAccountInformationUpdated, 'vint-hill:0:ps-mpa-1', update.accountInformation);
      sinon.assert.calledWith(listener.onPositionUpdated, 'vint-hill:0:ps-mpa-1', update.updatedPositions[0]);
      sinon.assert.calledWith(listener.onPositionRemoved, 'vint-hill:0:ps-mpa-1', update.removedPositionIds[0]);
      sinon.assert.calledWith(listener.onPendingOrderUpdated, 'vint-hill:0:ps-mpa-1', update.updatedOrders[0]);
      sinon.assert.calledWith(listener.onPendingOrderCompleted, 'vint-hill:0:ps-mpa-1', update.completedOrderIds[0]);
      sinon.assert.calledWith(listener.onHistoryOrderAdded, 'vint-hill:0:ps-mpa-1', update.historyOrders[0]);
      sinon.assert.calledWith(listener.onDealAdded, 'vint-hill:0:ps-mpa-1', update.deals[0]);
    });

    /**
     * @test {MetaApiWebsocketClient#getServerTime}
     */
    it('should retrieve server time from API', async () => {
      let serverTime = {
        time: new Date('2022-01-01T00:00:00.000Z'),
        brokerTime: '2022-01-01 02:00:00.000Z'
      };
      server.on('request', data => {
        if (data.type === 'getServerTime' && data.accountId === 'accountId' &&
          data.application === 'RPC') {
          server.emit('response', {
            type: 'response', accountId: data.accountId, requestId: data.requestId,
            serverTime
          });
        }
      });
      let actual = await client.getServerTime('accountId');
      actual.should.match(serverTime);
    });

    /**
     * @test {MetaApiWebsocketClient#calculateMargin}
     */
    it('should calculate margin', async () => {
      let margin = {
        margin: 110
      };
      let order = {
        symbol: 'EURUSD',
        type: 'ORDER_TYPE_BUY',
        volume: 0.1,
        openPrice: 1.1
      };
      server.on('request', data => {
        if (data.type === 'calculateMargin' && data.accountId === 'accountId' &&
          data.application === 'MetaApi' && JSON.stringify(data.order) === JSON.stringify(order)) {
          server.emit('response', {
            type: 'response', accountId: data.accountId, requestId: data.requestId,
            margin
          });
        }
      });
      let actual = await client.calculateMargin('accountId', 'MetaApi', 'high', order);
      actual.should.match(margin);
    });

  });

  describe('market data synchronization', () => {

    beforeEach(() => {
      sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    });

    afterEach(() => {
      client.removeAllListeners();
    });

    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should retry request on failure', async () => {
      let requestCounter = 0;
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
      server.on('request', data => {
        if (requestCounter > 1 && data.type === 'getOrder' && data.accountId === 'accountId' &&
          data.orderId === '46871284' && data.application === 'RPC') {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, order});
        } 
        requestCounter++;
      });
      let actual = await client.getOrder('accountId', '46871284');
      actual.should.match(order);
    }).timeout(20000);

    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should wait specified amount of time on too many requests error', async () => {
      let requestCounter = 0;
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
      server.on('request', data => {
        if (requestCounter > 0 && data.type === 'getOrder' && data.accountId === 'accountId' &&
          data.orderId === '46871284' && data.application === 'RPC') {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, order});
        } else {
          server.emit('processingError', {
            id: 1, error: 'TooManyRequestsError', requestId: data.requestId,
            message: 'The API allows 10000 requests per 60 minutes to avoid overloading our servers.',
            status_code: 429, metadata: {
              periodInMinutes: 60, maxRequestsForPeriod: 10000, 
              recommendedRetryTime: new Date(Date.now() + 1000)
            }
          });
        }
        requestCounter++;
      });
      const startTime = Date.now();
      let actual = await client.getOrder('accountId', '46871284');
      actual.should.match(order);
      (Date.now() - startTime).should.be.approximately(1000, 100);
    }).timeout(10000);

    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should return too many requests exception if recommended time is beyond max request time', async () => {
      let requestCounter = 0;
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
      server.on('request', data => {
        if (requestCounter > 0 && data.type === 'getOrder' && data.accountId === 'accountId' &&
              data.orderId === '46871284' && data.application === 'RPC') {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, order});
        } else {
          server.emit('processingError', {
            id: 1, error: 'TooManyRequestsError', requestId: data.requestId,
            message: 'The API allows 10000 requests per 60 minutes to avoid overloading our servers.',
            status_code: 429, metadata: {
              periodInMinutes: 60, maxRequestsForPeriod: 10000, 
              recommendedRetryTime: new Date(Date.now() + 60000)
            }
          });
        }
        requestCounter++;
      });

      try {
        await client.getOrder('accountId', '46871284');
        throw new Error('TooManyRequestsError expected');
      } catch (err) {
        err.name.should.equal('TooManyRequestsError');
      }
    }).timeout(10000);    

    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should not retry request on validation error', async () => {
      let requestCounter = 0;
      server.on('request', data => {
        if (requestCounter > 0 && data.type === 'subscribeToMarketData' && data.accountId === 'accountId' &&
          data.symbol === 'EURUSD' && data.application === 'application' && data.instanceIndex === 0) {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        } else {
          server.emit('processingError', {
            id: 1, error: 'ValidationError', message: 'Error message', requestId: data.requestId
          });
        }
        requestCounter ++;
      });
      try {
        await client.subscribeToMarketData('accountId', 'EURUSD', 'regular');
        throw new Error('ValidationError expected');
      } catch (err) {
        err.name.should.equal('ValidationError');
      }
      sinon.assert.match(requestCounter, 1);
    }).timeout(6000);
    
    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should not retry trade requests on fail', async () => {
      let requestCounter = 0;
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD',
        volume: 0.07
      };
      server.on('request', data => {
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          if(requestCounter > 0) {
            sinon.assert.fail();
          }
          requestCounter++;
        }
      });
      try {
        await client.trade('accountId', trade);
        throw new Error('TimeoutError expected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
    }).timeout(6000);

    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should not retry request if connection closed between retries', async () => {
      let requestCounter = 0;
      let response = {type: 'response', accountId: 'accountId'};
      server.on('request', async data => {
        if (data.type === 'unsubscribe' && data.accountId === 'accountId') {
          server.emit('response', Object.assign({requestId: data.requestId}, response));
        }
  
        if (data.type === 'getOrders' && data.accountId === 'accountId' && data.application === 'RPC') {
          requestCounter++;
          server.emit('processingError', {
            id: 1, error: 'NotSynchronizedError', message: 'Error message',
            requestId: data.requestId
          });
        }
      });
      client.unsubscribe('accountId');
      try {
        await client.getOrders('accountId');
        throw new Error('NotSynchronizedError expected');
      } catch (err) {
        err.name.should.equal('NotSynchronizedError');
      }
      requestCounter.should.equal(1);
      client.socketInstancesByAccounts.should.not.have.property('accountId');
    });
  
    /**
     * @test {MetaApiWebsocketClient#rpcRequest}
     */
    it('should return timeout error if no server response received', async () => {
      let trade = {
        actionType: 'ORDER_TYPE_SELL',
        symbol: 'AUDNZD',
        volume: 0.07
      };
      server.on('request', data => {
      });
      try {
        await client.trade('accountId', trade);
        throw new Error('TimeoutError extected');
      } catch (err) {
        err.name.should.equal('TimeoutError');
      }
    }).timeout(20000);

    /**
     * @test {MetaApiWebsocketClient#subscribeToMarketData}
     */
    it('should subscribe to market data with MetaTrader terminal', async () => {
      let requestReceived = false;
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 1});
      await new Promise(res => setTimeout(res, 50));
      server.on('request', data => {
        if (data.type === 'subscribeToMarketData' && data.accountId === 'accountId' && data.symbol === 'EURUSD' &&
          data.application === 'application' && data.instanceIndex === 0 &&
          JSON.stringify(data.subscriptions) === JSON.stringify([{type: 'quotes'}])) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.subscribeToMarketData('accountId', 'EURUSD', [{type: 'quotes'}], 'regular');
      requestReceived.should.be.true();
    });

    /**
     * @test {MetaApiWebsocketClient#subscribeToMarketData}
     */
    it('should subscribe to market data with MetaTrader terminal for high reliability account', async () => {
      let requestReceived = false;
      let requestReceived1 = false;
      server.on('request', data => {
        if (data.type === 'subscribeToMarketData' && data.accountId === 'accountId' && data.symbol === 'EURUSD' &&
              data.application === 'application' && data.instanceIndex === 0 &&
              JSON.stringify(data.subscriptions) === JSON.stringify([{type: 'quotes'}])) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      server1.on('request', data => {
        if (data.type === 'subscribeToMarketData' && data.accountId === 'accountId' && data.symbol === 'EURUSD' &&
              data.application === 'application' && data.instanceIndex === 1 &&
              JSON.stringify(data.subscriptions) === JSON.stringify([{type: 'quotes'}])) {
          requestReceived1 = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.subscribeToMarketData('accountId', 'EURUSD', [{type: 'quotes'}], 'high');
      await new Promise(res => setTimeout(res, 100));
      requestReceived.should.be.true();
      requestReceived1.should.be.true();
    });

    /**
     * @test {MetaApiWebsocketClient#refreshMarketDataSubscriptions}
     */
    it('should refresh market data subscriptions', async () => {
      let requestReceived = false;
      server.on('request', data => {
        if (data.type === 'refreshMarketDataSubscriptions' && data.accountId === 'accountId' && 
          data.application === 'application' && data.instanceIndex === 0 &&
          JSON.stringify(data.subscriptions) === JSON.stringify([{symbol: 'EURUSD'}])) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.refreshMarketDataSubscriptions('accountId', 0, [{symbol: 'EURUSD'}]);
      requestReceived.should.be.true();
    });

    /**
     * @test {MetaApiWebsocketClient#unsubscribeFromMarketData}
     */
    it('should unsubscribe from market data with MetaTrader terminal', async () => {
      let requestReceived = false;
      server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, replicas: 1});
      await new Promise(res => setTimeout(res, 50));
      server.on('request', data => {
        if (data.type === 'unsubscribeFromMarketData' && data.accountId === 'accountId' && data.symbol === 'EURUSD' &&
          data.application === 'application' && data.instanceIndex === 0 &&
          JSON.stringify(data.subscriptions) === JSON.stringify([{type: 'quotes'}])) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.unsubscribeFromMarketData('accountId', 'EURUSD', [{type: 'quotes'}], 'regular');
      requestReceived.should.be.true();
    });

    it('should finish synchronizing deals', async () => {
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      sandbox.stub(synchronizationThrottler, 'activeSynchronizationIds').get(() => ['ABC']);
      let listener = {
        onSynchronizationStarted: () => {},
        onDealsSynchronized: () => {}
      };
      const syncStub = sandbox.stub(listener, 'onDealsSynchronized').resolves();
      sandbox.stub(synchronizationThrottler, 'removeSynchronizationId').returns();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, synchronizationId: 'ABC'});
      server.emit('synchronization', {type: 'dealSynchronizationFinished', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, synchronizationId: 'ABC'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(syncStub, 'vint-hill:0:ps-mpa-1', 'ABC');
      sinon.assert.calledWith(client._latencyService.onDealsSynchronized, 'accountId:vint-hill:0:ps-mpa-1');
      sinon.assert.calledWith(synchronizationThrottler.removeSynchronizationId, 'ABC');
    });

    it('should finish synchronizing orders', async () => {
      client._socketInstances['vint-hill'][0][0].synchronizationThrottler = synchronizationThrottler;
      sandbox.stub(synchronizationThrottler, 'activeSynchronizationIds').get(() => ['ABC']);
      let listener = {
        onSynchronizationStarted: () => {},
        onHistoryOrdersSynchronized: () => {}
      };
      const syncStub = sandbox.stub(listener, 'onHistoryOrdersSynchronized').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, synchronizationId: 'ABC'});
      server.emit('synchronization', {type: 'orderSynchronizationFinished', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, synchronizationId: 'ABC'});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(syncStub, 'vint-hill:0:ps-mpa-1', 'ABC');
    });

    it('should downgrade subscription', async () => {
      let listener = {
        onSynchronizationStarted: () => {},
        onSubscriptionDowngraded: () => {}
      };
      const syncStub = sandbox.stub(listener, 'onSubscriptionDowngraded').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'downgradeSubscription', accountId: 'accountId', host: 'ps-mpa-1',
        instanceIndex: 0, symbol: 'EURUSD', unsubscriptions: [{type: 'ticks'}, {type: 'books'}]});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(syncStub, 'vint-hill:0:ps-mpa-1', 'EURUSD', undefined,
        [{ type: 'ticks' }, { type: 'books' }]);
    });

    it('should synchronize symbol specifications', async () => {
      let specifications = [{
        symbol: 'EURUSD',
        tickSize: 0.00001,
        minVolume: 0.01,
        maxVolume: 200,
        volumeStep: 0.01
      }];
      let listener = {
        onSymbolSpecificationsUpdated: () => {
        },
        onSymbolSpecificationUpdated: () => {
        },
        onSymbolSpecificationRemoved: () => {
        }
      };
      sandbox.stub(listener, 'onSymbolSpecificationsUpdated').resolves();
      sandbox.stub(listener, 'onSymbolSpecificationUpdated').resolves();
      sandbox.stub(listener, 'onSymbolSpecificationRemoved').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization',
        {type: 'specifications', accountId: 'accountId', specifications, instanceIndex: 0, host: 'ps-mpa-1',
          removedSymbols: ['AUDNZD']});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onSymbolSpecificationsUpdated, 'vint-hill:0:ps-mpa-1',
        specifications, ['AUDNZD']);
      sinon.assert.calledWith(listener.onSymbolSpecificationUpdated, 'vint-hill:0:ps-mpa-1', specifications[0]);
      sinon.assert.calledWith(listener.onSymbolSpecificationRemoved, 'vint-hill:0:ps-mpa-1', 'AUDNZD');
    });

    it('should synchronize symbol prices', async () => {
      let prices = [{
        symbol: 'AUDNZD',
        bid: 1.05916,
        ask: 1.05927,
        profitTickValue: 0.602,
        lossTickValue: 0.60203
      }];
      let ticks = [{
        symbol: 'AUDNZD',
        time: new Date('2020-04-07T03:45:00.000Z'),
        brokerTime: '2020-04-07 06:45:00.000',
        bid: 1.05297,
        ask: 1.05309,
        last: 0.5298,
        volume: 0.13,
        side: 'buy'
      }];
      let candles = [{
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
      }];
      let books = [{
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
      }];
      let listener = {
        onSymbolPriceUpdated: () => {},
        onSymbolPricesUpdated: () => {},
        onCandlesUpdated: () => {},
        onTicksUpdated: () => {},
        onBooksUpdated: () => {}
      };
      sandbox.stub(listener, 'onSymbolPriceUpdated').resolves();
      sandbox.stub(listener, 'onSymbolPricesUpdated').resolves();
      sandbox.stub(listener, 'onCandlesUpdated').resolves();
      sandbox.stub(listener, 'onTicksUpdated').resolves();
      sandbox.stub(listener, 'onBooksUpdated').resolves();
      client.addSynchronizationListener('accountId', listener);
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', host: 'ps-mpa-1', prices,
        ticks, candles, books, equity: 100, margin: 200, freeMargin: 400, marginLevel: 40000, instanceIndex: 0});
      await new Promise(res => setTimeout(res, 50));
      sinon.assert.calledWith(listener.onSymbolPricesUpdated, 'vint-hill:0:ps-mpa-1', prices, 100, 200, 400, 40000);
      sinon.assert.calledWith(listener.onCandlesUpdated, 'vint-hill:0:ps-mpa-1', candles, 100, 200, 400, 40000);
      sinon.assert.calledWith(listener.onTicksUpdated, 'vint-hill:0:ps-mpa-1', ticks, 100, 200, 400, 40000);
      sinon.assert.calledWith(listener.onBooksUpdated, 'vint-hill:0:ps-mpa-1', books, 100, 200, 400, 40000);
      sinon.assert.calledWith(listener.onSymbolPriceUpdated, 'vint-hill:0:ps-mpa-1', prices[0]);
    });

  });

  describe('wait for server-side terminal state synchronization', () => {

    afterEach(() => {
      client.removeAllListeners();
    });

    /**
     * @test {MetaApiWebsocketClient#waitSynchronized}
     */
    it('should wait for server-side terminal state synchronization', async () => {
      let requestReceived = false;
      server.on('request', data => {
        if (data.type === 'waitSynchronized' && data.accountId === 'accountId' &&
          data.applicationPattern === 'app.*' && data.timeoutInSeconds === 10 &&
          data.application === 'application' && data.instanceIndex === 0) {
          requestReceived = true;
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId});
        }
      });
      await client.waitSynchronized('accountId', 0, 'app.*', 10);
      requestReceived.should.be.true();
    });

  });

  describe('latency monitoring', () => {

    beforeEach(() => {
      sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    });

    /**
     * @test {LatencyListener#onResponse}
     */
    it('should invoke latency listener on response', async () => {
      let accountId;
      let requestType;
      let actualTimestamps;
      let listener = {
        onResponse: (aid, type, ts) => {
          accountId = aid;
          requestType = type;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      let price = {};
      let timestamps;
      server.on('request', data => {
        if (data.type === 'getSymbolPrice' && data.accountId === 'accountId' && data.symbol === 'AUDNZD' &&
          data.application === 'RPC' && data.timestamps.clientProcessingStarted) {
          timestamps = Object.assign(data.timestamps, {serverProcessingStarted: new Date(),
            serverProcessingFinished: new Date()});
          timestamps.clientProcessingStarted = new Date(timestamps.clientProcessingStarted);
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, price,
            timestamps});
        }
      });
      await client.getSymbolPrice('accountId', 'AUDNZD');
      await new Promise(res => setTimeout(res, 100));
      accountId.should.equal('accountId');
      requestType.should.equal('getSymbolPrice');
      actualTimestamps.should.match(timestamps);
      should.exist(actualTimestamps.clientProcessingStarted);
      should.exist(actualTimestamps.clientProcessingFinished);
      should.exist(actualTimestamps.serverProcessingStarted);
      should.exist(actualTimestamps.serverProcessingFinished);
    });

    /**
     * @test {LatencyListener#onSymbolPrice}
     */
    it('should measure price streaming latencies', async () => {
      let prices = [{
        symbol: 'AUDNZD',
        timestamps: {
          eventGenerated: new Date(),
          serverProcessingStarted: new Date(),
          serverProcessingFinished: new Date()
        }
      }];
      let accountId;
      let symbol;
      let actualTimestamps;
      let listener = {
        onSymbolPrice: (aid, sym, ts) => {
          accountId = aid;
          symbol = sym;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      server.emit('synchronization', {type: 'prices', accountId: 'accountId', prices, equity: 100, margin: 200,
        freeMargin: 400, marginLevel: 40000});
      await new Promise(res => setTimeout(res, 50));
      accountId.should.equal('accountId');
      symbol.should.equal('AUDNZD');
      actualTimestamps.should.match(prices[0].timestamps);
      should.exist(actualTimestamps.clientProcessingFinished);
    });

    /**
     * @test {LatencyListener#onUpdate}
     */
    it('should measure update latencies', async () => {
      let update = {
        timestamps: {
          eventGenerated: new Date(),
          serverProcessingStarted: new Date(),
          serverProcessingFinished: new Date()
        }
      };
      let accountId;
      let actualTimestamps;
      let listener = {
        onUpdate: (aid, ts) => {
          accountId = aid;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      server.emit('synchronization', Object.assign({type: 'update', accountId: 'accountId'}, update));
      await new Promise(res => setTimeout(res, 50));
      accountId.should.equal('accountId');
      actualTimestamps.should.match(update.timestamps);
      should.exist(actualTimestamps.clientProcessingFinished);
    });

    /**
     * @test {LatencyListener#onTrade}
     */
    it('should process trade latency', async () => {
      let trade = {};
      let response = {
        numericCode: 10009,
        stringCode: 'TRADE_RETCODE_DONE',
        message: 'Request completed',
        orderId: '46870472'
      };
      let timestamps = {
        clientExecutionStarted: new Date(),
        serverExecutionStarted: new Date(),
        serverExecutionFinished: new Date(),
        tradeExecuted: new Date()
      };
      let accountId;
      let actualTimestamps;
      let listener = {
        onTrade: (aid, ts) => {
          accountId = aid;
          actualTimestamps = ts;
        }
      };
      client.addLatencyListener(listener);
      server.on('request', data => {
        data.trade.should.match(trade);
        if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
          server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response,
            timestamps});
        }
      });
      await client.trade('accountId', trade);
      accountId.should.equal('accountId');
      actualTimestamps.should.match(timestamps);
      should.exist(actualTimestamps.clientProcessingFinished);
    });

  });

  it('should reconnect to server on disconnect', async () => {
    const trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    const response = {
      numericCode: 10009,
      stringCode: 'TRADE_RETCODE_DONE',
      message: 'Request completed',
      orderId: '46870472'
    };
    let listener = {
      onReconnected: () => {},
    };
    sandbox.stub(listener, 'onReconnected').resolves();
    sandbox.stub(client._packetOrderer, 'onReconnected').resolves();
    sandbox.stub(client._subscriptionManager, 'onReconnected').resolves();
    client.addReconnectListener(listener, 'accountId');
    let requestCounter = 0;
    server.on('request', async data => {
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        requestCounter++;
        await server.emit('response', {type: 'response', accountId: data.accountId, 
          requestId: data.requestId, response});
      }
      await server.disconnect();
    });
  
    client.trade('accountId', trade);
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(1500);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledOnce(listener.onReconnected);
    sinon.assert.calledWith(client._subscriptionManager.onReconnected, 0, 0, ['accountId']);
    sinon.assert.calledWith(client._packetOrderer.onReconnected, ['accountId']);

    server.on('request', async data => {
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        requestCounter++;
        await server.emit('response', {type: 'response', accountId: data.accountId, 
          requestId: data.requestId, response});
      }
      await server.disconnect();
    });
  
    client.trade('accountId', trade);
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(1500);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.match(requestCounter, 2);
  });

  /**
   * @test {MetaApiWebsocketClient#rpcRequest}
   */
  it('should cancel synchronization on disconnect', async () => {
    sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    activeSynchronizationIdsStub.get(() => [
      'synchronizationId', 'ABC2', 'ABC3', 'ABC4'
    ]);
    client._socketInstancesByAccounts[0].accountId2 = 1;
    client._socketInstancesByAccounts[0].accountId3 = 0;
    client._socketInstancesByAccounts[1].accountId4 = 0;
    client.addAccountCache('accountId2', {'vint-hill': 'accountId2'});
    client.addAccountCache('accountId3', {'new-york': 'accountId3'});
    client.addAccountCache('accountId4', {'vint-hill': 'accountId4'});
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId',
      sequenceTimestamp: 1603124267178, synchronizationId: 'synchronizationId'});
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId2',
      sequenceTimestamp: 1603124267178, synchronizationId: 'ABC2'});
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId3',
      sequenceTimestamp: 1603124267178, synchronizationId: 'ABC3'});
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId4',
      sequenceTimestamp: 1603124267178, synchronizationId: 'ABC4'});
    await new Promise(res => setTimeout(res, 50));
    should.exist(client._synchronizationFlags.synchronizationId);
    should.exist(client._synchronizationFlags.ABC2);
    should.exist(client._synchronizationFlags.ABC3);
    should.exist(client._synchronizationFlags.ABC4);
    await server.disconnect();
    await new Promise(res => setTimeout(res, 1200));
    should.not.exist(client._synchronizationFlags.synchronizationId);
    should.exist(client._synchronizationFlags.ABC2);
    should.exist(client._synchronizationFlags.ABC3);
    should.exist(client._synchronizationFlags.ABC4);
  });

  /**
   * @test {MetaApiWebsocketClient#rpcRequest}
   */
  it('should remove reconnect listener', async () => {
    let trade = {
      actionType: 'ORDER_TYPE_SELL',
      symbol: 'AUDNZD',
      volume: 0.07
    };
    let response = {
      numericCode: 10009,
      stringCode: 'TRADE_RETCODE_DONE',
      message: 'Request completed',
      orderId: '46870472'
    };
    const listener = {onReconnected: async () => {}};
    sandbox.stub(listener, 'onReconnected').resolves();
    client.addReconnectListener(listener, 'accountId');
    sandbox.stub(client._subscriptionManager, 'onReconnected');
    let requestCounter = 0;
    server.on('request', data => {
      data.trade.should.match(trade);
      requestCounter++;
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
      server.disconnect();
    });

    await client.trade('accountId', trade);
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(1100);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledOnce(listener.onReconnected);
    client.removeReconnectListener(listener);

    server.on('request', data => {
      data.trade.should.match(trade);
      requestCounter++;
      if (data.type === 'trade' && data.accountId === 'accountId' && data.application === 'application') {
        server.emit('response', {type: 'response', accountId: data.accountId, requestId: data.requestId, response});
      }
      server.disconnect();
    });

    await client.trade('accountId', trade);
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(1100);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledOnce(listener.onReconnected);
    sinon.assert.match(requestCounter, 2);
  });

  /**
   * @test {MetaApiWebsocketClient#queuePacket}
   */
  it('should process packets in order', async () => {
    let ordersCallTime = 0;
    let positionsCallTime = 0;
    let disconnectedCallTime = 0;
    let pricesCallTime = 0;
    let listener = {
      onConnected: () => {},
      onDisconnected: async () => {
        await new Promise(res => setTimeout(res, 5000));
        disconnectedCallTime = Date.now();
      },
      onStreamClosed: () => {},
      onPendingOrdersReplaced: async () => {
        await new Promise(res => setTimeout(res, 10000));
        ordersCallTime = Date.now();
      },
      onPendingOrdersSynchronized: () => {},
      onPositionsReplaced: async () => {
        await new Promise(res => setTimeout(res, 1000));
        positionsCallTime = Date.now();
      },
      onPositionsSynchronized: () => {},
      onSymbolPriceUpdated: () => {},
      onSymbolPricesUpdated: async () => {
        await new Promise(res => setTimeout(res, 1000));
        pricesCallTime = Date.now();
      },
    };
    let resolve;
    let promise = new Promise(res => resolve = res);
    client.close();
    io.close(() => resolve());
    await promise;
    io = new Server(6785, {path: '/ws', pingTimeout: 1000000});
    client = new MetaApiWebsocketClient(domainClient, 'token', {application: 'application', 
      domain: 'project-stock.agiliumlabs.cloud', requestTimeout: 1.5, useSharedClientApi: false,
      retryOpts: { retries: 3, minDelayInSeconds: 0.1, maxDelayInSeconds: 0.5},
      eventProcessing: {sequentialProcessing: true}});
    sandbox.stub(client._latencyService, 'onConnected').returns();
    sandbox.stub(client._latencyService, 'onDisconnected').returns();
    sandbox.stub(client._latencyService, 'onUnsubscribe').returns();
    client.url = 'http://localhost:6785';
    client.addAccountCache('accountId', {'vint-hill': 'accountId'});
    sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    io.on('connect', socket => {
      server = socket;
      if (socket.request._query['auth-token'] !== 'token') {
        socket.emit({error: 'UnauthorizedError', message: 'Authorization token invalid'});
        socket.close();
      }
      server.on('request', data => {
        if (data.type === 'getPositions' && data.accountId === 'accountId' && data.application === 'RPC') {
          server.emit('response', {type: 'response', accountId: data.accountId, 
            requestId: data.requestId, positions: []});
        } else if (data.type === 'subscribe') {
          server.emit('response', {type: 'response', accountId: data.accountId, 
            requestId: data.requestId});
        }
      });
    });
    await client.subscribe('accountId', 1);
    await client.getPositions('accountId');
    client.addSynchronizationListener('accountId', listener);
    sandbox.stub(client._packetOrderer, 'restoreOrder').callsFake((arg) => {
      return [arg];
    });
    server.emit('synchronization', {type: 'authenticated', accountId: 'accountId', host: 'ps-mpa-1',
      instanceIndex: 0, replicas: 2, sequenceNumber: 1});
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(59000);
    server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders: [], instanceIndex: 0,
      host: 'ps-mpa-1', sequenceNumber: 2});
    server.emit('synchronization', {type: 'prices', accountId: 'accountId', prices: [{symbol: 'EURUSD'}], 
      instanceIndex: 0, host: 'ps-mpa-1', equity: 100, margin: 200, freeMargin: 400, marginLevel: 40000});
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(3000);
    server.emit('synchronization', {type: 'positions', accountId: 'accountId', positions: [], instanceIndex: 0,
      host: 'ps-mpa-1', sequenceNumber: 3});
    await new Promise(res => setTimeout(res, 50));
    await clock.tickAsync(20000);
    await new Promise(res => setTimeout(res, 50));
    pricesCallTime.should.not.eql(0);
    (ordersCallTime).should.be.above(pricesCallTime);
    (disconnectedCallTime).should.be.above(ordersCallTime);
    (positionsCallTime).should.be.above(disconnectedCallTime);
  });

  /**
   * @test {MetaApiWebsocketClient#queuePacket}
   */
  it('should not process old synchronization packet without gaps in sequence numbers', async () => {
    let listener = {
      onSynchronizationStarted: sinon.fake(),
      onPendingOrdersReplaced: sinon.fake(),
      onPendingOrdersSynchronized: () => {}
    };
    client.addSynchronizationListener('accountId', listener);
    sandbox.stub(client._subscriptionManager, 'isSubscriptionActive').returns(true);
    sandbox.stub(client._packetOrderer, 'restoreOrder').callsFake(arg => [arg]);

    sandbox.stub(client._socketInstances['vint-hill'][0][0].synchronizationThrottler,
      'activeSynchronizationIds').get(() => ['ABC']);
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId',
      sequenceNumber: 1, sequenceTimestamp: 1603124267178, synchronizationId: 'ABC'});
    server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders: [],
      sequenceNumber: 2, sequenceTimestamp: 1603124267181, synchronizationId: 'ABC'});
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledOnce(listener.onSynchronizationStarted);
    sinon.assert.calledOnce(listener.onPendingOrdersReplaced);

    sandbox.stub(client._socketInstances['vint-hill'][0][0].synchronizationThrottler,
      'activeSynchronizationIds').get(() => ['DEF']);
    server.emit('synchronization', {type: 'synchronizationStarted', accountId: 'accountId',
      sequenceNumber: 3, sequenceTimestamp: 1603124267190, synchronizationId: 'DEF'});
    server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders: [],
      sequenceNumber: 4, sequenceTimestamp: 1603124267192, synchronizationId: 'ABC'});
    server.emit('synchronization', {type: 'orders', accountId: 'accountId', orders: [],
      sequenceNumber: 5, sequenceTimestamp: 1603124267195, synchronizationId: 'DEF'});
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledTwice(listener.onSynchronizationStarted);
    sinon.assert.calledTwice(listener.onPendingOrdersReplaced);
  });

  /**
   * @test {MetaApiWebsocketClient#queueEvent}
   */
  it('should process queued events sequentially', async () => {
    let event1 = sandbox.stub().callsFake(() => new Promise(res => setTimeout(res, 100)));
    let event2 = sandbox.stub().callsFake(() => new Promise(res => setTimeout(res, 25)));
    client.queueEvent('accountId', 'test', event1);
    client.queueEvent('accountId', 'test', event2);
    
    await clock.tickAsync(75);
    sinon.assert.calledOnce(event1);
    sinon.assert.notCalled(event2);
    
    await clock.tickAsync(30);
    sinon.assert.calledOnce(event2);
  });

  /**
   * @test {MetaApiWebsocketClient#queueEvent}
   * @test {MetaApiWebsocketClient#queuePacket}
   */
  it('should process queued events among synchronization packets', async () => {
    let listener = {
      onSynchronizationStarted: sandbox.stub().callsFake(() => new Promise(res => setTimeout(res, 100)))
    };
    let event = sandbox.stub().callsFake(() => new Promise(res => setTimeout(res, 25)));
    client.addSynchronizationListener('accountId', listener);

    client.queuePacket({
      type: 'synchronizationStarted', accountId: 'accountId', instanceIndex: 0, sequenceNumber: 1, sequenceTimestamp: 1,
      synchronizationId: 'synchronizationId', host: 'ps-mpa-1'
    });
    client.queueEvent('accountId', 'test', event);
    
    await clock.tickAsync(75);
    sinon.assert.calledOnce(listener.onSynchronizationStarted);
    sinon.assert.notCalled(event);

    await clock.tickAsync(30);
    sinon.assert.calledOnce(event);
  });

  /**
   * @test {MetaApiWebsocketClient#queueEvent}
   */
  it('should not throw errors from queued events', async () => {
    let event = sandbox.stub().rejects();
    client.queueEvent('accountId', 'test', event);
    await new Promise(res => setTimeout(res, 10));
    sinon.assert.calledOnce(event);
  });

});
