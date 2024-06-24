'use strict';

import should from 'should';
import sinon from 'sinon';
import MemoryHistoryStorage from './memoryHistoryStorage';

/**
 * @test {MemoryHistoryStorage}
 */
describe('MemoryHistoryStorage', () => {

  let storage;
  let sandbox;
  let clock;
  let realSetTimeout = setTimeout;
  let db = {
    loadHistory: () => {
      return {deals: [], historyOrders: []};
    },
    clear: () => {},
    flush: () => {}
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    storage = new MemoryHistoryStorage();
    storage._historyDatabase = db;
    await storage.initialize('accountId', 'MetaApi');
    await storage.clear();
    storage.onConnected('vint-hill:1:ps-mpa-1', 1);
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });
  
  /**
   * @test {MemoryHistoryStorage#loadDataFromDisk}
   */
  it('should load data from the file manager', async () => {
    let testDeal = {id:'37863643', type:'DEAL_TYPE_BALANCE', magic:0, time: new Date(100), commission:0,
      swap:0, profit:10000, platform:'mt5', comment:'Demo deposit 1'};
    let testOrder = {id:'61210463', type:'ORDER_TYPE_SELL', state:'ORDER_STATE_FILLED', symbol:'AUDNZD', magic:0,
      time: new Date(50), doneTime: new Date(100), currentPrice:1, volume:0.01,
      currentVolume:0, positionId:'61206630', platform:'mt5', comment:'AS_AUDNZD_5YyM6KS7Fv:'};
    sandbox.stub(db, 'loadHistory').resolves({deals: [testDeal], historyOrders: [testOrder]});
    await storage.initialize('accountId', 'MetaApi');
    await new Promise(res => realSetTimeout(res, 50));
    storage.deals.should.match([testDeal]);
    storage.historyOrders.should.match([testOrder]);
  });

  /**
   * @test {MemoryHistoryStorage#updateDiskStorage}
   */
  it('should clear db storage', async () => {
    sandbox.stub(db, 'clear').resolves();
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_SELL'});
    await storage.clear();
    sinon.assert.match(storage.deals, []);
    sinon.assert.match(storage.historyOrders, []);
    sinon.assert.calledWith(db.clear, 'accountId', 'MetaApi');
  });

  /**
   * @test {MemoryHistoryStorage#lastHistoryOrderTime}
   */
  it('should return last history order time', () => {
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '1'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '2', doneTime: new Date('2020-01-01T00:00:00.000Z')});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '3', doneTime: new Date('2020-01-02T00:00:00.000Z')});
    storage.lastHistoryOrderTime().should.match(new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MemoryHistoryStorage#lastDealTime}
   */
  it('should return last history deal time', () => {
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '1'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '2', time: new Date('2020-01-01T00:00:00.000Z')});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '3', time: new Date('2020-01-02T00:00:00.000Z')});
    storage.lastDealTime().should.match(new Date('2020-01-02T00:00:00.000Z'));
  });

  /**
   * @test {MemoryHistoryStorage#deals}
   */
  it('should return saved deals', () => {
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '1', positionId: '1', time: new Date('2020-01-01T00:00:00.000Z'),
      type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '7', time: new Date('2020-05-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '8', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '6', time: new Date('2020-10-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '4', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '11', type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '3', time: new Date('2020-09-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', 
      {id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '2', positionId: '1', time: new Date('2020-08-01T00:00:00.000Z'),
      type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '10', type: 'DEAL_TYPE_SELL'});
    storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '12', type: 'DEAL_TYPE_BUY'});
    storage.deals.should.match([
      {id: '10', type: 'DEAL_TYPE_SELL'},
      {id: '11', type: 'DEAL_TYPE_SELL'},
      {id: '12', type: 'DEAL_TYPE_BUY'},
      {id: '1', positionId: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '4', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '8', time: new Date('2020-02-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '7', time: new Date('2020-05-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      {id: '5', time: new Date('2020-06-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      {id: '2', positionId: '1', time: new Date('2020-08-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '3', time: new Date('2020-09-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      {id: '6', time: new Date('2020-10-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'}
    ]);
    storage.getDealsByTicket(1).should.match([
      {id: '1', positionId: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'}
    ]);
    storage.getDealsByPosition(1).should.match([
      {id: '1', positionId: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
      {id: '2', positionId: '1', time: new Date('2020-08-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'}
    ]);
    storage.getDealsByTimeRange(new Date('2020-08-01T00:00:00.000Z'), new Date('2020-09-01T00:00:00.000Z')).should
      .match([
        {id: '2', positionId: '1', time: new Date('2020-08-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'},
        {id: '3', time: new Date('2020-09-01T00:00:00.000Z'), type: 'DEAL_TYPE_BUY'},
      ]);
  });

  /**
   * @test {MemoryHistoryStorage#historyOrders}
   */
  it('should return saved historyOrders', () => {
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', 
      {id: '1', positionId: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '7', doneTime: new Date('2020-05-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '8', doneTime: new Date('2020-02-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '6', doneTime: new Date('2020-10-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '4', doneTime: new Date('2020-02-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '11', type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '3', doneTime: new Date('2020-09-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'),
      type: 'ORDER_TYPE_BUY'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', 
      {id: '2', positionId: '1', doneTime: new Date('2020-08-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '10', type: 'ORDER_TYPE_SELL'});
    storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '12', type: 'ORDER_TYPE_BUY'});
    storage.historyOrders.should.match([
      {id: '10', type: 'ORDER_TYPE_SELL'},
      {id: '11', type: 'ORDER_TYPE_SELL'},
      {id: '12', type: 'ORDER_TYPE_BUY'},
      {id: '1', positionId: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '4', doneTime: new Date('2020-02-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '8', doneTime: new Date('2020-02-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '7', doneTime: new Date('2020-05-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'},
      {id: '5', doneTime: new Date('2020-06-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'},
      {id: '2', positionId: '1', doneTime: new Date('2020-08-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '3', doneTime: new Date('2020-09-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'},
      {id: '6', doneTime: new Date('2020-10-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'}
    ]);
    storage.getHistoryOrdersByTicket(1).should.match([
      {id: '1', positionId: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'}
    ]);
    storage.getHistoryOrdersByPosition(1).should.match([
      {id: '1', positionId: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
      {id: '2', positionId: '1', doneTime: new Date('2020-08-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'}
    ]);
    storage.getHistoryOrdersByTimeRange(new Date('2020-08-01T00:00:00.000Z'), new Date('2020-09-01T00:00:00.000Z'))
      .should.match([
        {id: '2', positionId: '1', doneTime: new Date('2020-08-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'},
        {id: '3', doneTime: new Date('2020-09-01T00:00:00.000Z'), type: 'ORDER_TYPE_BUY'}
      ]);
  });

  /**
   * @test {MemoryHistoryStorage#orderSynchronizationFinished}
   */
  it('should return saved order synchronization status', async () => {
    storage.orderSynchronizationFinished.should.be.false();
    await storage.onHistoryOrdersSynchronized(1);
    storage.orderSynchronizationFinished.should.be.true();
  });

  /**
   * @test {MemoryHistoryStorage#dealSynchronizationFinished}
   */
  it('should return saved deal synchronization status', async () => {
    storage.dealSynchronizationFinished.should.be.false();
    await storage.onDealsSynchronized(1);
    storage.dealSynchronizationFinished.should.be.true();
  });

  describe('flush', () => {

    /**
     * @test {MemoryHistoryStorage#updateDiskStorage}
     */
    it('should flush db when synchronization ends', async () => {
      sandbox.stub(db, 'flush').resolves();
      storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '1', positionId: '1',
        doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
      storage.onDealAdded('vint-hill:1:ps-mpa-1', {id: '1', positionId: '1', time: new Date('2020-01-01T00:00:00.000Z'),
        type: 'DEAL_TYPE_SELL'});
      await storage.onDealsSynchronized(1);
      sinon.assert.calledWith(db.flush, 'accountId', 'MetaApi', [
        {id: '1', positionId: '1', doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'}
      ], [
        {id: '1', positionId: '1', time: new Date('2020-01-01T00:00:00.000Z'), type: 'DEAL_TYPE_SELL'}
      ]);
    });

    /**
     * @test {MemoryHistoryStorage#updateDiskStorage}
     */
    it('should flush db when new record arrives', async () => {
      await storage.onDealsSynchronized(1);
      sandbox.stub(db, 'flush').resolves();
      await storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '1', positionId: '1',
        doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
      clock.tick(5500);
      await new Promise(res => realSetTimeout(res, 50));
      sinon.assert.calledWith(db.flush, 'accountId', 'MetaApi', [{id: '1', positionId: '1',
        doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'}], []);
    });

    /**
     * @test {MemoryHistoryStorage#updateDiskStorage}
     */
    it('should throttle db flush', async () => {
      await storage.onDealsSynchronized(1);
      sandbox.stub(db, 'flush').resolves();
      await storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '1', positionId: '1',
        doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
      clock.tick(4500);
      await new Promise(res => realSetTimeout(res, 50));
      await storage.onHistoryOrderAdded('vint-hill:1:ps-mpa-1', {id: '2', positionId: '1',
        doneTime: new Date('2020-01-01T00:00:00.000Z'), type: 'ORDER_TYPE_SELL'});
      clock.tick(4500);
      await new Promise(res => realSetTimeout(res, 50));
      sinon.assert.notCalled(db.flush);
    });

  });

});
