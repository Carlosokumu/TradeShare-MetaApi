'use strict';

import should from 'should';
import sinon from 'sinon';
import StreamingMetaApiConnection from './streamingMetaApiConnection';
import ConnectionRegistry from './connectionRegistry';

/**
 * @test {ConnectionRegistry}
 */
describe('ConnectionRegistry', () => {

  let sandbox;
  let registry;
  let metaApiWebsocketClient = {
    addSynchronizationListener: () => {},
    addReconnectListener: () => {},
    subscribe: () => {},
    regionsByAccounts: {}
  };
  let storage = {
    lastHistoryOrderTime: () => new Date('2020-01-01T00:00:00.000Z'),
    lastDealTime: () => new Date('2020-01-02T00:00:00.000Z'),
    loadDataFromDisk: () => ({deals: [], historyOrders: []})
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });
  
  beforeEach(() => {
    registry = new ConnectionRegistry(metaApiWebsocketClient);
    sandbox.stub(StreamingMetaApiConnection.prototype, 'initialize').resolves();
    sandbox.stub(StreamingMetaApiConnection.prototype, 'subscribe').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {ConnectionRegistry#connect}
   */
  it('should connect and add connection to registry', async () => {
    let account = {id: 'id', region: 'vint-hill', accountRegions: {'vint-hill': 'id', 'new-york': 'idReplica'}};
    let connection = registry.connect(account, storage);
    await connection.connect();
    (connection instanceof StreamingMetaApiConnection).should.be.true();
    connection.historyStorage.should.equal(storage);
    sinon.assert.calledOnce(connection.initialize);
    sinon.assert.calledOnce(connection.subscribe);
    sinon.assert.match(registry._connections, sinon.match.has('id', connection));
  });

  /**
   * @test {ConnectionRegistry#connect}
   */
  it('should return the same connection on second connect if same account id', async () => {
    let accounts = [{id: 'id0', region: 'vint-hill', accountRegions: {'vint-hill': 'id0', 'new-york': 'id0Replica'}}, 
      {id: 'id1', region: 'vint-hill', accountRegions: {'vint-hill': 'id1', 'new-york': 'id1Replica'}}];
    let connection0 = registry.connect(accounts[0], storage);
    let connection02 = registry.connect(accounts[0], storage);
    let connection1 = registry.connect(accounts[1], storage);
    await connection0.connect();
    await connection02.connect();
    await connection1.connect();
    sinon.assert.called(connection0.initialize);
    sinon.assert.called(connection0.subscribe);
    sinon.assert.called(connection1.initialize);
    sinon.assert.called(connection1.subscribe);
    sinon.assert.match(registry._connections, sinon.match.has('id0', connection0));
    sinon.assert.match(registry._connections, sinon.match.has('id1', connection1));
    sinon.assert.match(Object.is(connection0, connection02), true);
    sinon.assert.match(Object.is(connection0, connection1), false);
  });

  /**
   * @test {ConnectionRegistry#remove}
   */
  it('should remove the account from registry', async () => {
    let accounts = [{id: 'id0', region: 'vint-hill', accountRegions: {'vint-hill': 'id0', 'new-york': 'id0Replica'}}, 
      {id: 'id1', region: 'vint-hill', accountRegions: {'vint-hill': 'id1', 'new-york': 'id1Replica'}}];
    let connection0 = await registry.connect(accounts[0], storage);
    let connection1 = await registry.connect(accounts[1], storage);
    sinon.assert.match(registry._connections, sinon.match.has('id0', connection0));
    sinon.assert.match(registry._connections, sinon.match.has('id1', connection1));
    registry.remove(accounts[0].id);
    sinon.assert.match(registry._connections.id0, undefined);
  });

});
