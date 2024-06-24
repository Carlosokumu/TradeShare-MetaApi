import PacketLogger from './packetLogger.es6';
import fs from 'fs-extra';
import sinon from 'sinon';

/**
 * @test {PacketLogger}
 */
describe('PacketLogger', () => {
  let packetLogger, clock, sandbox, packets;
  const folder = './.metaapi/logs/';
  const filePath = folder + '2020-10-10-00/accountId.log';

  function changeSN(obj, sequenceNumber, instanceIndex = 7) {
    return Object.assign({}, obj, {sequenceNumber, instanceIndex});
  }

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(async () => {
    clock = sinon.useFakeTimers({
      now: new Date('2020-10-10 00:00:00.000'),
      shouldAdvanceTime: true
    });
    packetLogger = new PacketLogger({fileNumberLimit: 3, logFileSizeInHours: 4});
    packetLogger.start();
    await fs.emptyDir(folder);
    packets = {
      accountInformation: {
        type: 'accountInformation',
        instanceIndex: 7,
        accountInformation: {
          broker: 'Broker',
          currency: 'USD',
          server: 'Broker-Demo',
          balance: 20000,
          equity: 25000
        },
        sequenceTimestamp: 100000,
        accountId: 'accountId'
      },
      prices: {
        type:'prices',
        instanceIndex: 7,
        prices: [{
          symbol: 'EURUSD',
          bid: 1.18,
          ask: 1.19
        },
        {
          symbol: 'USDJPY',
          bid: 103.222,
          ask: 103.25
        }],
        accountId: 'accountId',
        sequenceTimestamp: 100000,
        sequenceNumber: 1
      },
      status: {
        status: 'connected',
        instanceIndex: 7,
        type: 'status',
        accountId: 'accountId',
        sequenceTimestamp: 100000
      },
      keepalive: {
        instanceIndex: 7,
        type: 'keepalive',
        accountId: 'accountId',
        sequenceTimestamp: 100000
      },
      specifications: {
        specifications: [],
        instanceIndex: 7,
        type: 'specifications',
        accountId: 'accountId',
        sequenceTimestamp: 100000,
        sequenceNumber: 1
      }
    };
  
  });

  afterEach(async () => {
    await fs.emptyDir(folder);
    packetLogger.stop();
    clock.restore();
    sandbox.restore();
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record packet', async () => {
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match(JSON.parse(result[0].message), packets.accountInformation);
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should not record status and keepalive packets', async () => {
    packetLogger.logPacket(packets.status);
    packetLogger.logPacket(packets.keepalive);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const exists = await fs.pathExists(filePath);
    sinon.assert.match(exists, false);
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record shortened specifications', async () => {
    packetLogger.logPacket(packets.specifications);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match({type: 'specifications', sequenceNumber: 1, sequenceTimestamp: 100000, instanceIndex: 7}, 
      JSON.parse(result[0].message));
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record full specifications if compress disabled', async () => {
    packetLogger.stop();
    packetLogger = new PacketLogger({fileNumberLimit: 3, logFileSizeInHours: 4, compressSpecifications: false});
    packetLogger.start();
    packetLogger.logPacket(packets.specifications);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match({
      accountId: 'accountId', 
      type: 'specifications', 
      sequenceNumber: 1,
      instanceIndex: 7,
      sequenceTimestamp: 100000, 
      specifications: []
    }, JSON.parse(result[0].message));
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record single price packet', async () => {
    packetLogger.logPacket(packets.prices);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match(packets.prices, JSON.parse(result[0].message));
    sinon.assert.match(packets.accountInformation, JSON.parse(result[1].message));
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record range of price packets', async () => {
    packetLogger.logPacket(packets.prices);
    packetLogger.logPacket(changeSN(packets.prices, 2));
    packetLogger.logPacket(changeSN(packets.prices, 3));
    packetLogger.logPacket(changeSN(packets.prices, 4));
    packetLogger.logPacket(changeSN(packets.keepalive, 5));
    packetLogger.logPacket(changeSN(packets.prices, 6));
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match(packets.prices, JSON.parse(result[0].message));
    sinon.assert.match(changeSN(packets.prices, 6), JSON.parse(result[1].message));
    sinon.assert.match('Recorded price packets 1-6, instanceIndex: 7', result[2].message);
    sinon.assert.match(packets.accountInformation, JSON.parse(result[3].message));
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record range of price packets of different instances', async () => {
    packetLogger.logPacket(packets.prices);
    packetLogger.logPacket(changeSN(packets.prices, 2));
    packetLogger.logPacket(changeSN(packets.prices, 3));
    packetLogger.logPacket(changeSN(packets.prices, 1, 8));
    packetLogger.logPacket(changeSN(packets.prices, 2, 8));
    packetLogger.logPacket(changeSN(packets.prices, 3, 8));
    packetLogger.logPacket(changeSN(packets.prices, 4, 8));
    packetLogger.logPacket(changeSN(packets.prices, 4));
    packetLogger.logPacket(changeSN(packets.prices, 5, 8));
    packetLogger.logPacket(Object.assign({}, packets.accountInformation, {instanceIndex: 8}));
    packetLogger.logPacket(changeSN(packets.prices, 5));
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match(packets.prices, JSON.parse(result[0].message));
    sinon.assert.match(changeSN(packets.prices, 1, 8), JSON.parse(result[1].message));
    sinon.assert.match(changeSN(packets.prices, 5, 8), JSON.parse(result[2].message));
    sinon.assert.match('Recorded price packets 1-5, instanceIndex: 8', result[3].message);
    sinon.assert.match(Object.assign({}, packets.accountInformation, {instanceIndex: 8}), 
      JSON.parse(result[4].message));
    sinon.assert.match(changeSN(packets.prices, 5), JSON.parse(result[5].message));
    sinon.assert.match('Recorded price packets 1-5, instanceIndex: 7', result[6].message);
    sinon.assert.match(packets.accountInformation, JSON.parse(result[7].message));
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should record all price packets if compress disabled', async () => {
    packetLogger.stop();
    packetLogger = new PacketLogger({fileNumberLimit: 3, logFileSizeInHours: 4, compressPrices: false});
    packetLogger.start();
    packetLogger.logPacket(packets.prices);
    packetLogger.logPacket(changeSN(packets.prices, 2));
    packetLogger.logPacket(changeSN(packets.prices, 3));
    packetLogger.logPacket(changeSN(packets.prices, 4));
    packetLogger.logPacket(changeSN(packets.prices, 5));
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 200));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match(packets.prices, JSON.parse(result[0].message));
    sinon.assert.match(changeSN(packets.prices, 2), JSON.parse(result[1].message));
    sinon.assert.match(changeSN(packets.prices, 3), JSON.parse(result[2].message));
    sinon.assert.match(changeSN(packets.prices, 4), JSON.parse(result[3].message));
    sinon.assert.match(changeSN(packets.prices, 5), JSON.parse(result[4].message));
    sinon.assert.match(packets.accountInformation, JSON.parse(result[5].message));
  });

  /**
   * @test {PacketLogger#logPacket}
   */
  it('should stop price packet sequence if price sequence number doesnt match', async () => {
    packetLogger.logPacket(packets.prices);
    packetLogger.logPacket(changeSN(packets.prices, 2));
    packetLogger.logPacket(changeSN(packets.prices, 3));
    packetLogger.logPacket(changeSN(packets.prices, 4));
    packetLogger.logPacket(changeSN(packets.prices, 6));
    await clock.tickAsync(1000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId');
    sinon.assert.match(packets.prices, JSON.parse(result[0].message));
    sinon.assert.match(changeSN(packets.prices, 4), JSON.parse(result[1].message));
    sinon.assert.match('Recorded price packets 1-4, instanceIndex: 7', result[2].message);
    sinon.assert.match(changeSN(packets.prices, 6), JSON.parse(result[3].message));
  });

  /**
   * @test {PacketLogger#readLogs}
   */
  it('should read logs within bounds', async () => {
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(60 * 60 * 1000);
    await new Promise(res => setTimeout(res, 100));
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(60 * 60 * 1000);
    await new Promise(res => setTimeout(res, 100));
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(2000);
    await new Promise(res => setTimeout(res, 100));
    const result = await packetLogger.readLogs('accountId', 
      new Date('2020-10-10 00:30:00.000'), new Date('2020-10-10 01:30:00.000'));
    sinon.assert.match(result.length, 5);
    const resultAfter = await packetLogger.readLogs('accountId', 
      new Date('2020-10-10 00:30:00.000'));
    sinon.assert.match(resultAfter.length, 8);
    const resultBefore = await packetLogger.readLogs('accountId', 
      undefined, new Date('2020-10-10 01:30:00.000'));
    sinon.assert.match(resultBefore.length, 7);
  });

  /**
   * @test {PacketLogger#_deleteOldData}
   */
  it('should delete expired folders', async () => {
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(11000);
    await new Promise(res => setTimeout(res, 100));
    sinon.assert.match(await fs.readdir(folder), ['2020-10-10-00']);

    clock.tick(4 * 60 * 60 * 1000);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(11000);
    await new Promise(res => setTimeout(res, 100));
    sinon.assert.match(await fs.readdir(folder), ['2020-10-10-00', '2020-10-10-01']);

    clock.tick(4 * 60 * 60 * 1000);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(11000);
    await new Promise(res => setTimeout(res, 100));
    sinon.assert.match(await fs.readdir(folder), ['2020-10-10-00', '2020-10-10-01', '2020-10-10-02']);

    clock.tick(4 * 60 * 60 * 1000);
    packetLogger.logPacket(packets.accountInformation);
    await clock.tickAsync(10000);
    await new Promise(res => setTimeout(res, 100));
    sinon.assert.match(await fs.readdir(folder), ['2020-10-10-01', '2020-10-10-02', '2020-10-10-03']);
  });

});
