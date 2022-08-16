'use strict';

import should from 'should';
import sinon from 'sinon';
import LatencyService from './latencyService';
import Server from 'socket.io';
 
/**
 * @test {LatencyService}
 */
describe('LatencyService', () => {

  let io;
  let clock;
  let service;
  let sandbox;
  const token = 'token';
  let client = {
    ensureSubscribe: () => {},
    unsubscribe: () => {},
    getUrlSettings: () => {},
    unsubscribeAccountRegion: () => {},
    getAccountRegion: (replicaId) => {
      if(replicaId === 'accountIdReplica') {
        return 'new-york';
      } else {
        return 'vint-hill';
      }
    },
    accountReplicas: {
      accountId: {
        'vint-hill': 'accountId',
        'new-york': 'accountIdReplica'
      }
    },
    accountsByReplicaId: {
      accountId: 'accountId',
      accountIdReplica: 'accountId'
    }
  };
  let unsubscribeStub;
  let getUrlSettingsStub;
  let ensureSubscribeStub;
  let unsubscribeRegionStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });
 
  beforeEach(async () => {
    clock = sinon.useFakeTimers({shouldAdvanceTime: true});
    service = new LatencyService(client, token, 5000);

    io = new Server(6785, {path: '/ws', pingTimeout: 1000000});
    io.on('connect', socket => {
      if (socket.request._query['auth-token'] !== 'token') {
        socket.emit({error: 'UnauthorizedError', message: 'Authorization token invalid'});
        socket.close();
      }
    });
    getUrlSettingsStub = sandbox.stub(client, 'getUrlSettings')
      .resolves({url: 'http://localhost:6785', isSharedClientApi: true});
    unsubscribeStub = sandbox.stub(client, 'unsubscribe').resolves();
    ensureSubscribeStub = sandbox.stub(client, 'ensureSubscribe').resolves();
    unsubscribeRegionStub = sandbox.stub(client, 'unsubscribeAccountRegion').resolves();
  });
 
  afterEach(async () => {
    clock.restore();
    sandbox.restore();
    let resolve;
    let promise = new Promise(res => resolve = res);
    io.close(() => resolve());
    await promise;
  });

  /**
   * @test {LatencyService#onConnected}
   */
  it('should process onConnected event', async () => {
    await service.onConnected('accountId:vint-hill:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), ['accountId:vint-hill:0:ps-mpa-1']);
  });

  /**
   * @test {LatencyService#onConnected}
   */
  it('should disconnect connected instances with bigger ping', async () => {
    clock.tickAsync(3000);
    await service.onConnected('accountId:new-york:0:ps-mpa-1');
    await service.onConnected('accountId:vint-hill:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:new-york:0:ps-mpa-1', 'accountId:vint-hill:0:ps-mpa-1']);
    sinon.assert.calledWith(unsubscribeStub, 'accountIdReplica');
    sinon.assert.calledWith(unsubscribeRegionStub, 'accountId', 'new-york');
  });

  /**
   * @test {LatencyService#onDealsSynchronized}
   */
  it('should disconnect synchronized instances with bigger ping', async () => {
    clock.tickAsync(3000);
    await service.onConnected('accountId:new-york:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:new-york:0:ps-mpa-1');
    await service.onConnected('accountId:vint-hill:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:new-york:0:ps-mpa-1', 'accountId:vint-hill:0:ps-mpa-1']);
    sinon.assert.notCalled(unsubscribeStub);
    await service.onDealsSynchronized('accountId:vint-hill:0:ps-mpa-1');
    sinon.assert.calledWith(unsubscribeStub, 'accountIdReplica');
    sinon.assert.calledWith(unsubscribeRegionStub, 'accountId', 'new-york');
  });

  /**
   * @test {LatencyService#onConnected}
   */
  it('should not double check ping if two accounts connected at the same time', async () => {
    service.onConnected('accountId:new-york:0:ps-mpa-1');
    await service.onConnected('accountId2:new-york:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:new-york:0:ps-mpa-1']);
    sinon.assert.match(service.getActiveAccountInstances('accountId2'), 
      ['accountId2:new-york:0:ps-mpa-1']);
    sinon.assert.calledOnce(getUrlSettingsStub);
  });

  /**
   * @test {LatencyService#_refreshRegionLatencyJob}
   */
  it('should deploy to a better ping if ping stats changed on refresh', async () => {
    clock.tickAsync(3000);
    await service.onConnected('accountId:vint-hill:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:vint-hill:0:ps-mpa-1');
    await service.onConnected('accountId:new-york:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:new-york:0:ps-mpa-1');
    sinon.assert.calledWith(unsubscribeStub, 'accountId');
    sinon.assert.calledWith(unsubscribeRegionStub, 'accountId', 'vint-hill');
    await service.onUnsubscribe('accountId');
    await clock.tickAsync(15 * 60 * 1000 - 2900);
    await service._refreshPromisesByRegion['vint-hill'];
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 50));
    sinon.assert.calledWith(ensureSubscribeStub, 'accountId', 0);
    sinon.assert.calledWith(ensureSubscribeStub, 'accountId', 1);
  });

  /**
   * @test {LatencyService#onDisconnected}
   */
  it('should subscribe replicas on disconnected event if all replicas offline', async () => {
    await service.onConnected('accountId:vint-hill:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:vint-hill:0:ps-mpa-1');
    await service.onConnected('accountId:new-york:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:new-york:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1', 'accountId:new-york:0:ps-mpa-1']);
    sinon.assert.match(service.getSynchronizedAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1', 'accountId:new-york:0:ps-mpa-1']);
    await service.onDisconnected('accountId:new-york:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1']);
    sinon.assert.match(service.getSynchronizedAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1']);
    sinon.assert.notCalled(ensureSubscribeStub);
    await service.onDisconnected('accountId:vint-hill:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), []);
    sinon.assert.match(service.getSynchronizedAccountInstances('accountId'), []);
    sinon.assert.calledWith(ensureSubscribeStub, 'accountIdReplica', 0);
    sinon.assert.calledWith(ensureSubscribeStub, 'accountIdReplica', 1);
  });

  /**
   * @test {LatencyService#onUnsubscribe}
   */
  it('should mark accounts as disconnected on unsubscribe', async () => {
    await service.onConnected('accountId:vint-hill:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:vint-hill:0:ps-mpa-1');
    await service.onConnected('accountId:new-york:0:ps-mpa-1');
    await service.onDealsSynchronized('accountId:new-york:0:ps-mpa-1');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1', 'accountId:new-york:0:ps-mpa-1']);
    sinon.assert.match(service.getSynchronizedAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1', 'accountId:new-york:0:ps-mpa-1']);
    await service.onUnsubscribe('accountIdReplica');
    sinon.assert.match(service.getActiveAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1']);
    sinon.assert.match(service.getSynchronizedAccountInstances('accountId'), 
      ['accountId:vint-hill:0:ps-mpa-1']);
  });

});
