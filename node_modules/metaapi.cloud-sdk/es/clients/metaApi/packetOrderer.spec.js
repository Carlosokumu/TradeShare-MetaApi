'use strict';

import sinon from 'sinon';
import should from 'should';
import PacketOrderer from './packetOrderer';

/**
 * @test {PacketOrderer}
 */
describe('PacketOrderer', () => {

  let sandbox;
  let packetOrderer;
  let outOfOrderListener = {
    onOutOfOrderPacket: (accountId, instanceIndex, expectedSequenceNumber, actualSequenceNumber, packet) => {}
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    packetOrderer = new PacketOrderer(outOfOrderListener, 0.5);
    packetOrderer.start();
  });

  afterEach(() => {
    packetOrderer.stop();
    sandbox.restore();
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should return packets without a sequence number out immediately', () => {
    let packetWithoutSN = {
      type: 'authenticated',
      connectionId: 'accountId',
      accountId: 'accountId'
    };
    packetOrderer.restoreOrder(packetWithoutSN).should.deepEqual([packetWithoutSN]);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should restore packet order', () => {
    let firstPacket = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267178,
      sequenceNumber: 13,
      synchronizationId: 'synchronizationId'
    };
    let secondPacket = {
      type: 'prices',
      sequenceTimestamp: 1603124267180,
      sequenceNumber: 14,
    };
    let thirdPacket = {
      type: 'accountInformation',
      sequenceTimestamp: 1603124267187,
      sequenceNumber: 15,
    };
    let fourthPacket = {
      type: 'positions',
      sequenceTimestamp: 1603124267188,
      sequenceNumber: 16,
    };
    packetOrderer.restoreOrder(secondPacket).should.deepEqual([]);
    packetOrderer.restoreOrder(firstPacket).should.deepEqual([firstPacket, secondPacket]);
    packetOrderer.restoreOrder(fourthPacket).should.deepEqual([]);
    packetOrderer.restoreOrder(thirdPacket).should.deepEqual([thirdPacket, fourthPacket]);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should filter out packets from previous synchronization attempt that includes synchronization start', () => {
    let previousStart = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267178,
      sequenceNumber: 13,
      synchronizationId: 'synchronizationId'
    };
    let oneOfPreviousPackets = {
      type: 'positions',
      sequenceTimestamp: 1603124267188,
      sequenceNumber: 15,
    };
    let thisSpecifications = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267198,
      sequenceNumber: 1,
      synchronizationId: 'synchronizationId'
    };
    let thisSecondPacket = {
      type: 'prices',
      sequenceTimestamp: 1603124268198,
      sequenceNumber: 2,
    };
    packetOrderer.restoreOrder(previousStart).should.deepEqual([previousStart]);
    packetOrderer.restoreOrder(oneOfPreviousPackets).should.deepEqual([]);
    packetOrderer.restoreOrder(thisSecondPacket).should.deepEqual([]);
    packetOrderer.restoreOrder(thisSpecifications).should.deepEqual([thisSpecifications, thisSecondPacket]);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should filter out packets from previous synchronization attempt that does not include the start', () => {
    let oneOfPreviousPackets = {
      type: 'positions',
      sequenceTimestamp: 1603124267188,
      sequenceNumber: 15,
    };
    let thisStart = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267198,
      sequenceNumber: 16,
      synchronizationId: 'synchronizationId'
    };
    let thisSecondPacket = {
      type: 'prices',
      sequenceTimestamp: 1603124268198,
      sequenceNumber: 17,
    };
    packetOrderer.restoreOrder(oneOfPreviousPackets).should.deepEqual([]);
    packetOrderer.restoreOrder(thisSecondPacket).should.deepEqual([]);
    packetOrderer.restoreOrder(thisStart).should.deepEqual([thisStart, thisSecondPacket]);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should pass trough duplicate packets', () => {
    let specificationsPacket = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267198,
      sequenceNumber: 16,
      synchronizationId: 'synchronizationId'
    };
    let secondPacket = {
      type: 'prices',
      sequenceTimestamp: 1603124268198,
      sequenceNumber: 17,
    };
    packetOrderer.restoreOrder(specificationsPacket).should.deepEqual([specificationsPacket]);
    packetOrderer.restoreOrder(secondPacket).should.deepEqual([secondPacket]);
    packetOrderer.restoreOrder(secondPacket).should.deepEqual([secondPacket]);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should return in-order packets immediately', () => {
    let firstPacket = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267178,
      sequenceNumber: 13,
      synchronizationId: 'synchronizationId'
    };
    let secondPacket = {
      type: 'prices',
      sequenceTimestamp: 1603124267180,
      sequenceNumber: 14,
    };
    let thirdPacket = {
      type: 'accountInformation',
      sequenceTimestamp: 1603124267187,
      sequenceNumber: 15,
    };
    packetOrderer.restoreOrder(firstPacket).should.deepEqual([firstPacket]);
    packetOrderer.restoreOrder(secondPacket).should.deepEqual([secondPacket]);
    packetOrderer.restoreOrder(thirdPacket).should.deepEqual([thirdPacket]);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should call on-out-of-order listener only once per synchronzation attempt', async () => {
    sandbox.stub(outOfOrderListener, 'onOutOfOrderPacket').returns();
    let firstPacket = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267178,
      sequenceNumber: 13,
      synchronizationId: 'synchronizationId',
      accountId: 'accountId'
    };
    let thirdPacket = {
      type: 'orders',
      sequenceTimestamp: 1603124267193,
      sequenceNumber: 15,
      accountId: 'accountId'
    };
    packetOrderer.restoreOrder(firstPacket).should.deepEqual([firstPacket]);
    packetOrderer.restoreOrder(thirdPacket).should.deepEqual([]);
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.calledWith(outOfOrderListener.onOutOfOrderPacket,
      'accountId', 0, 14, 15, thirdPacket);
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.calledOnce(outOfOrderListener.onOutOfOrderPacket);
  }).timeout(3000);

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should call on-out-of-order listener if the first packet in wait list is timed out', async () => {
    sandbox.stub(outOfOrderListener, 'onOutOfOrderPacket').returns();
    let timedOutPacket = {
      accountId: 'accountId',
      instanceId: 'accountId:0:ps-mpa-1',
      host: 'ps-mpa-1',
      instanceIndex: 0,
      sequenceNumber: 11,
      packet: {},
      receivedAt: new Date('2010-10-19T09:58:56.000Z')
    };
    let notTimedOutPacket = {
      accountId: 'accountId',
      instanceId: 'accountId:0:ps-mpa-1',
      host: 'ps-mpa-1',
      instanceIndex: 0,
      sequenceNumber: 15,
      packet: {},
      receivedAt: new Date('3015-10-19T09:58:56.000Z')
    };
    packetOrderer._sequenceNumberByInstance['accountId:0:ps-mpa-1'] = 1;
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'] = [
      timedOutPacket,
      notTimedOutPacket
    ];
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.calledWith(outOfOrderListener.onOutOfOrderPacket,
      'accountId', 0, 2, 11, timedOutPacket.packet);
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.calledOnce(outOfOrderListener.onOutOfOrderPacket);
  }).timeout(3000);

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should not call on-out-of-order listener if the first packet in wait list is not timed out', async () => {
    sandbox.stub(outOfOrderListener, 'onOutOfOrderPacket').returns();
    let timedOutPacket = {
      sequenceNumber: 11,
      packet: {},
      receivedAt: new Date('2010-10-19T09:58:56.000Z')
    };
    let notTimedOutPacket = {
      sequenceNumber: 15,
      packet: {},
      receivedAt: new Date('3015-10-19T09:58:56.000Z')
    };
    packetOrderer._sequenceNumberByInstance['accountId:0'] = 1;
    packetOrderer._packetsByInstance['accountId:0'] = [
      notTimedOutPacket,
      timedOutPacket
    ];
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.notCalled(outOfOrderListener.onOutOfOrderPacket);
  }).timeout(3000);

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should not call on-out-of-order listener for packets that come before synchronization start', async () => {
    sandbox.stub(outOfOrderListener, 'onOutOfOrderPacket').returns();
    let outOfOrderPacket = {
      accountId: 'accountId',
      sequenceNumber: 11,
      packet: {},
      receivedAt: new Date('2010-10-19T09:58:56.000Z')
    };

    // There were no synchronization start packets
    packetOrderer._sequenceNumberByInstance['accountId:0'] = undefined;

    packetOrderer._packetsByInstance['accountId:0'] = [outOfOrderPacket];
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.notCalled(outOfOrderListener.onOutOfOrderPacket);
  }).timeout(3000);

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should maintain a fixed queue of wait list', () => {
    packetOrderer._waitListSizeLimit = 1;
    let secondPacket = {
      type: 'prices',
      sequenceTimestamp: 1603124267180,
      sequenceNumber: 14,
      accountId: 'accountId',
      host: 'ps-mpa-1'
    };
    let thirdPacket = {
      type: 'accountInformation',
      sequenceTimestamp: 1603124267187,
      sequenceNumber: 15,
      accountId: 'accountId',
      host: 'ps-mpa-1'
    };
    packetOrderer.restoreOrder(secondPacket);
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'].length.should.equal(1);
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'][0].packet.should.equal(secondPacket);
    packetOrderer.restoreOrder(thirdPacket);
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'].length.should.equal(1);
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'][0].packet.should.equal(thirdPacket);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should count start packets with undefined synchronziationId as out-of-order', () => {
    let startPacket = {
      type: 'synchronizationStarted',
      sequenceTimestamp: 1603124267198,
      sequenceNumber: 16,
      accountId: 'accountId',
      host: 'ps-mpa-1'
    };
    packetOrderer.restoreOrder(startPacket).should.deepEqual([]);
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'].length.should.equal(1);
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'][0].packet.should.deepEqual(startPacket);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should reset state on reconnected event', async () => {
    sandbox.stub(outOfOrderListener, 'onOutOfOrderPacket').returns();
    let timedOutPacket = {
      accountId: 'accountId',
      instanceId: 'accountId:0:ps-mpa-1',
      host: 'ps-mpa-1',
      instanceIndex: 0,
      sequenceNumber: 11,
      packet: {},
      receivedAt: new Date('2010-10-19T09:58:56.000Z')
    };
    let notTimedOutPacket = {
      accountId: 'accountId',
      instanceId: 'accountId:0:ps-mpa-1',
      host: 'ps-mpa-1',
      instanceIndex: 0,
      sequenceNumber: 15,
      packet: {},
      receivedAt: new Date('3015-10-19T09:58:56.000Z')
    };
    packetOrderer._sequenceNumberByInstance['accountId:0:ps-mpa-1'] = 1;
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'] = [
      timedOutPacket,
      notTimedOutPacket
    ];
    packetOrderer.onReconnected(['accountId']);
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.notCalled(outOfOrderListener.onOutOfOrderPacket);
  });

  /**
   * @test {PacketOrderer#restoreOrder}
   */
  it('should reset state for an instance on stream closed event', async () => {
    sandbox.stub(outOfOrderListener, 'onOutOfOrderPacket').returns();
    let timedOutPacket = {
      accountId: 'accountId',
      instanceId: 'accountId:0:ps-mpa-1',
      host: 'ps-mpa-1',
      instanceIndex: 0,
      sequenceNumber: 11,
      packet: {},
      receivedAt: new Date('2010-10-19T09:58:56.000Z')
    };
    let notTimedOutPacket = {
      accountId: 'accountId',
      instanceId: 'accountId:0:ps-mpa-1',
      host: 'ps-mpa-1',
      instanceIndex: 0,
      sequenceNumber: 15,
      packet: {},
      receivedAt: new Date('3015-10-19T09:58:56.000Z')
    };
    packetOrderer._sequenceNumberByInstance['accountId:0:ps-mpa-1'] = 1;
    packetOrderer._packetsByInstance['accountId:0:ps-mpa-1'] = [
      timedOutPacket,
      notTimedOutPacket
    ];
    packetOrderer.onStreamClosed('accountId:0:ps-mpa-1');
    await new Promise(res => setTimeout(res, 1000));
    sinon.assert.notCalled(outOfOrderListener.onOutOfOrderPacket);
  });
});
