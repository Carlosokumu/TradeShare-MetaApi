'use strict';

import sinon from 'sinon';
import ConnectionHealthMonitor from './connectionHealthMonitor';

/**
 * @test {ConnectionHealthMonitor}
 */
describe('ConnectionHealthMonitor', () => {
  let healthMonitor, sandbox, prices, connection;
  let brokerTimes = ['2020-10-05 09:00:00.000', '2020-10-10 10:00:00.000']; 
  let clock, updateInterval;

  before(() => {
    sandbox = sinon.createSandbox();
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.4833333;
    global.Math = mockMath;
  });

  beforeEach(() => {
    clock = sinon.useFakeTimers({
      now: new Date('2020-10-05 10:00:00.000')
    });
    connection = {
      account: {id: 'id'},
      subscribedSymbols: ['EURUSD'],
      terminalState: {
        specification: () => {},
        connected: true,
        connectedToBroker: true,
      },
      synchronized: true
    };
    sandbox.stub(connection.terminalState, 'specification')
      .returns({quoteSessions: {'MONDAY': [{from: '08:00:00.000', to: '17:00:00.000'}]}});
    healthMonitor = new ConnectionHealthMonitor(connection);
    prices = [{
      symbol: 'EURUSD',
      brokerTime: brokerTimes[0],
    },
    {
      symbol: 'EURUSD',
      brokerTime: brokerTimes[1],
    }];
    updateInterval = setInterval(() => healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]), 1000);
  });

  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  /**
   * @test {ConnectionHealthMonitor#uptime}
   */
  describe('uptime', () => {

    /**
     * @test {ConnectionHealthMonitor#uptime}
     */
    it('should return 100 uptime', async () => {
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]);
      await clock.tickAsync(60000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 100, '1d': 100, '1w': 100});
    });

    /**
     * @test {ConnectionHealthMonitor#uptime}
     */
    it('should return average uptime', async () => {
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]);
      await clock.tickAsync(31000);
      clearInterval(updateInterval);
      await clock.tickAsync(120000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 60, '1d': 60, '1w': 60});
    });

    /**
     * @test {ConnectionHealthMonitor#uptime}
     */
    it('should check connection for downtime', async () => {
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]);
      await clock.tickAsync(120000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 100, '1d': 100, '1w': 100});
      connection.terminalState.connected = false;
      await clock.tickAsync(120000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 50, '1d': 50, '1w': 50});
      connection.terminalState.connected = true;
      connection.terminalState.connectedToBroker = false;
      await clock.tickAsync(240000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 25, '1d': 25, '1w': 25});
      connection.terminalState.connectedToBroker = true;
      connection.synchronized = false;
      await clock.tickAsync(120000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 20, '1d': 20, '1w': 20});
      connection.synchronized = true;
      await clock.tickAsync(360000);
      sinon.assert.match(healthMonitor.uptime, {'1h': 50, '1d': 50, '1w': 50});
    });

  });

  /**
   * @test {ConnectionHealthMonitor#healthStatus}
   */
  describe('healthStatus', () => {

    beforeEach(() => {
      healthMonitor._quotesHealthy = true;
    });

    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should return ok status', async () => {
      sinon.assert.match(healthMonitor.healthStatus, {
        connected: true,
        connectedToBroker: true,
        healthy: true,
        message: 'Connection to broker is stable. No health issues detected.',
        quoteStreamingHealthy: true,
        synchronized: true
      });
    });

    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should return error status with one message', async () => {
      connection.terminalState.connectedToBroker = false;
      sinon.assert.match(healthMonitor.healthStatus, {
        connected: true,
        connectedToBroker: false,
        healthy: false,
        message: 'Connection is not healthy because connection to broker is not established or lost.',
        quoteStreamingHealthy: true,
        synchronized: true
      });
    });

    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should return error status with multiple messages', async () => {
      connection.terminalState.connected = false;
      connection.terminalState.connectedToBroker = false;
      connection.synchronized = false;
      sinon.assert.match(healthMonitor.healthStatus, {
        connected: false,
        connectedToBroker: false,
        healthy: false,
        message: 'Connection is not healthy because connection to API server is not established or lost and ' +
            'connection to broker is not established or lost ' +
            'and local terminal state is not synchronized to broker.',
        quoteStreamingHealthy: true,
        synchronized: false
      });
    });

    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should show as healthy if recently updated and in session', async () => {
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]);
      await clock.tickAsync(91000);
      sinon.assert.match(healthMonitor.healthStatus.quoteStreamingHealthy, true);
    });
    
    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should show as not healthy if old update and in session', async () => {
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]);
      clearInterval(updateInterval);
      await clock.tickAsync(91000);
      sinon.assert.match(healthMonitor.healthStatus.quoteStreamingHealthy, false);
    });
    
    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should show as healthy if not in session', async () => {
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[1]);
      clearInterval(updateInterval);
      await clock.tickAsync(91000);
      sinon.assert.match(healthMonitor.healthStatus.quoteStreamingHealthy, true);
    });
    
    /**
     * @test {ConnectionHealthMonitor#healthStatus}
     */
    it('should show as healthy if no symbols', async () => {
      healthMonitor._connection.subscribedSymbols = [];
      healthMonitor.onSymbolPriceUpdated('vint-hill:1:ps-mpa-1', prices[0]);
      clearInterval(updateInterval);
      await clock.tickAsync(91000);
      sinon.assert.match(healthMonitor.healthStatus.quoteStreamingHealthy, true);
    });

  });
  
});
