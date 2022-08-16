import SynchronizationThrottler from './synchronizationThrottler';
import sinon from 'sinon';

/**
 * @test {SynchronizationThrottler}
 */
describe('SynchronizationThrottler', () => {
  let throttler, clock, sandbox, websocketClient, getHashes;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: new Date('2020-10-05T10:00:00.000Z'),
      shouldAdvanceTime: true
    });
    websocketClient = {
      rpcRequest: (accountId, request, timeoutInSeconds) => {},
      subscribedAccountIds: () => new Array(11),
      socketInstances: {'vint-hill': {0: [{synchronizationThrottler: {synchronizingAccounts: []}}]}},
    };  
    websocketClient.rpcRequest = sandbox.stub();
    getHashes = () => ({
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'
    });
    throttler = new SynchronizationThrottler(websocketClient, 0, 0, 'vint-hill');
    throttler.start();
  });

  afterEach(() => {
    clock.restore();
  });
    
  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should immediately send request if free slots exist', async () => {
    await throttler.scheduleSynchronize('accountId', {requestId: 'test'}, getHashes);
    sinon.assert.match(throttler._synchronizationIds, {test: 1601892000000});
    throttler.removeSynchronizationId('test');
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId', {
      requestId: 'test',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.match(throttler._synchronizationIds, {});
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should not remove sync if different instance index', async () => {
    await throttler.scheduleSynchronize('accountId', {requestId: 'test', instanceIndex: 0}, getHashes);
    await throttler.scheduleSynchronize('accountId', {requestId: 'test1', instanceIndex: 1}, getHashes);
    sinon.assert.match(throttler._synchronizationIds, {test: 1601892000000, test1: 1601892000000});
    throttler.removeSynchronizationId('test', 0);
    sinon.assert.match(throttler._synchronizationIds, {test1: 1601892000000});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId', {
      requestId: 'test', 
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333', 
      instanceIndex: 0});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId', {
      requestId: 'test1',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333', 
      instanceIndex: 1});
    sinon.assert.match(throttler._synchronizationIds, {});
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should wait for other sync requests to finish if slots are full', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId1', {
      requestId: 'test1',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId2', {
      requestId: 'test2',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333',});
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 2);
    throttler.removeSynchronizationId('test1');
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should increase slot amount with more subscribed accounts', async () => {
    websocketClient.subscribedAccountIds = () => new Array(21);
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    await throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId1', {
      requestId: 'test1',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId2', {
      requestId: 'test2',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId3', {
      requestId: 'test3',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should set hard limit for concurrent synchronizations across throttlers via options', async () => {
    websocketClient.subscribedAccountIds = () => new Array(21);
    throttler = new SynchronizationThrottler(websocketClient, 0, 0, 'vint-hill', {maxConcurrentSynchronizations: 3});
    websocketClient.socketInstances = {'vint-hill': {0: [{synchronizationThrottler: throttler},
      {synchronizationThrottler: {synchronizingAccounts: ['accountId4']}}]}};
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    throttler.scheduleSynchronize('accountId4', {requestId: 'test4'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 2);
    throttler.removeSynchronizationId('test1');
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should not take extra slots if sync ids belong to the same account', async () => {
    throttler.scheduleSynchronize('accountId', {requestId: 'test', instanceIndex: 0}, getHashes);
    throttler.scheduleSynchronize('accountId', {requestId: 'test1', instanceIndex: 1}, getHashes);
    throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId', {
      requestId: 'test',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333',
      instanceIndex: 0});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId', {
      requestId: 'test1',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333',
      instanceIndex: 1});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId2', {
      requestId: 'test2',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.match(throttler._synchronizationIds, {});
  });

  /**
   * @test {SynchronizationThrottler#_removeOldSyncIdsJob}
   */
  it('should clear expired synchronization slots if no packets for 10 seconds', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 2);
    await clock.tickAsync(11000);
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#updateSynchronizationId}
   */
  it('should renew sync on update', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 2);
    await clock.tickAsync(11000);
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
    await clock.tickAsync(11000);
    throttler.updateSynchronizationId('test1');
    throttler.scheduleSynchronize('accountId4', {requestId: 'test4'}, getHashes);
    throttler.scheduleSynchronize('accountId5', {requestId: 'test5'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 4);
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should replace previous syncs', async () => {
    throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    throttler.scheduleSynchronize('accountId1', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId1', {requestId: 'test3'}, getHashes);
    throttler.scheduleSynchronize('accountId2', {requestId: 'test4'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test5'}, getHashes);
    throttler.scheduleSynchronize('accountId1', {requestId: 'test3', instanceIndex: 0});
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 4);
  });

  /**
   * @test {SynchronizationThrottler#onDisconnect}
   */
  it('should clear existing sync ids on disconnect', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 2);
    throttler.onDisconnect();
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    await new Promise(res => setTimeout(res, 20));
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
  });

  /**
   * @test {SynchronizationThrottler#_removeFromQueue}
   */
  it('should remove synchronizations from queue', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}), getHashes;
    throttler.scheduleSynchronize('accountId3', {requestId: 'test4', instanceIndex: 0}, getHashes);
    throttler.scheduleSynchronize('accountId4', {requestId: 'test5'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test6'}, getHashes);
    throttler.scheduleSynchronize('accountId4', {requestId: 'test7'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test8'}, getHashes);
    throttler.scheduleSynchronize('accountId5', {requestId: 'test9'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test10', instanceIndex: 0}, getHashes);
    await clock.tickAsync(53000);
    sinon.assert.callCount(websocketClient.rpcRequest, 6);
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId1', {
      requestId: 'test1',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId2', {
      requestId: 'test2',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId3', {
      requestId: 'test8',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId3', {
      requestId: 'test10',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333',
      instanceIndex: 0});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId4', {
      requestId: 'test7',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId5', {
      requestId: 'test9',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
  });

  /**
   * @test {SynchronizationThrottler#_removeOldSyncIdsJob}
   */
  it('should remove expired synchronizations from queue', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes).catch(() => {});
    throttler.scheduleSynchronize('accountId4', {requestId: 'test4'}, getHashes).catch(() => {});
    for (let i = 0; i < 20; i++) {
      await clock.tickAsync(8000);
      throttler.updateSynchronizationId('test1');
      throttler.updateSynchronizationId('test2');
    }
    throttler.scheduleSynchronize('accountId5', {requestId: 'test5'}, getHashes);
    for (let i = 0; i < 20; i++) {
      await clock.tickAsync(8000);
      throttler.updateSynchronizationId('test1');
      throttler.updateSynchronizationId('test2');
    }
    await clock.tickAsync(33000);
    sinon.assert.callCount(websocketClient.rpcRequest, 3);
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId1', {
      requestId: 'test1',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId2', {
      requestId: 'test2',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId5', {
      requestId: 'test5',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
  });

  /**
   * @test {SynchronizationThrottler#scheduleSynchronize}
   */
  it('should not get queue stuck due to app synchronizations limit', async () => {
    throttler._client.socketInstances = {'vint-hill': {0: [{synchronizationThrottler: {synchronizingAccounts: [
      'accountId21', 'accountId22', 'accountId23', 'accountId24', 'accountId25', 'accountId26',
      'accountId27', 'accountId28', 'accountId29', 'accountId210', 'accountId211', 'accountId212', 
      'accountId213', 'accountId214', 'accountId215']}}, {synchronizationThrottler: throttler}]}};
    throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    await clock.tickAsync(5000);
    sinon.assert.notCalled(websocketClient.rpcRequest);
    throttler._client.socketInstances['vint-hill'][0][0].synchronizationThrottler.synchronizingAccounts = 
      throttler._client.socketInstances['vint-hill'][0][0].synchronizationThrottler.synchronizingAccounts.slice(1);
    await clock.tickAsync(5000);
    sinon.assert.callCount(websocketClient.rpcRequest, 1);
    throttler._client.socketInstances['vint-hill'][0][0].synchronizationThrottler.synchronizingAccounts = 
      throttler._client.socketInstances['vint-hill'][0][0].synchronizationThrottler.synchronizingAccounts.slice(1);
    await clock.tickAsync(5000);
    sinon.assert.callCount(websocketClient.rpcRequest, 2);
  });

  /**
   * @test {SynchronizationThrottler#removeSynchronizationId}
   */
  it('should not skip queue items when synchronization id is removed', async () => {
    throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    throttler.scheduleSynchronize('accountId2', {requestId: 'test2'}, getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    throttler.scheduleSynchronize('accountId4', {requestId: 'test4'}, getHashes);
    throttler.scheduleSynchronize('accountId5', {requestId: 'test5'}, getHashes);
    await clock.tickAsync(2000);
    throttler.removeSynchronizationId('test3');
    await clock.tickAsync(2000);
    throttler.removeSynchronizationId('test1');
    throttler.removeSynchronizationId('test2');
    await clock.tickAsync(2000);
    sinon.assert.callCount(websocketClient.rpcRequest, 4);
  });

  /**
   * @test {SynchronizationThrottler#removeIdByParameters}
   */
  it('should remove id by parameters', async () => {
    await throttler.scheduleSynchronize('accountId1', {requestId: 'test1'}, getHashes);
    await throttler.scheduleSynchronize('accountId2', {requestId: 'test2', instanceIndex: 0, host: 'ps-mpa-0'}, 
      getHashes);
    throttler.scheduleSynchronize('accountId3', {requestId: 'test3'}, getHashes);
    throttler.scheduleSynchronize('accountId2', {requestId: 'test4', instanceIndex: 1, host: 'ps-mpa-1'}, getHashes);
    throttler.scheduleSynchronize('accountId2', {requestId: 'test5', instanceIndex: 0, host: 'ps-mpa-2'}, getHashes);
    throttler.scheduleSynchronize('accountId4', {requestId: 'test6'});
    await new Promise(res => setTimeout(res, 50));
    throttler.scheduleSynchronize('accountId2', {requestId: 'test7', instanceIndex: 0, host: 'ps-mpa-3'}, getHashes);
    await new Promise(res => setTimeout(res, 50));
    throttler.removeIdByParameters('accountId2', 0, 'ps-mpa-0');
    throttler.removeIdByParameters('accountId2', 0, 'ps-mpa-3');
    throttler.removeIdByParameters('accountId2', 1, 'ps-mpa-1');
    throttler.removeSynchronizationId('test1');
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId3', {
      requestId: 'test3',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333'});
    sinon.assert.calledWith(websocketClient.rpcRequest, 'accountId2', {
      requestId: 'test5',
      positionsMd5: '1111',
      ordersMd5: '2222',
      specificationsMd5: '3333',
      instanceIndex: 0,
      host: 'ps-mpa-2'});
    sinon.assert.callCount(websocketClient.rpcRequest, 4);
  });

});