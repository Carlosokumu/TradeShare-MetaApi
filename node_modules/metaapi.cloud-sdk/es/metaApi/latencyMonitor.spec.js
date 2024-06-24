'use strict';

import should from 'should';
import LatencyMonitor from './latencyMonitor';

/**
 * @test {LatencyMonitor}
 */
describe('LatencyMonitor', () => {

  let monitor;

  beforeEach(() => {
    monitor = new LatencyMonitor();
  });

  /**
   * @test {LatencyMonitor#onTrade}
   */
  describe('onTrade', () => {

    /**
     * @test {LatencyMonitor#onTrade}
     * @test {LatencyMonitor#tradeLatencies}
     */
    it('should process trade latencies', async () => {
      monitor.onTrade('accountId', {
        clientProcessingStarted: new Date('2020-12-07T13:22:48.000Z'),
        serverProcessingStarted: new Date('2020-12-07T13:22:49.000Z'),
        tradeStarted: new Date('2020-12-07T13:22:51.000Z'),
        tradeExecuted: new Date('2020-12-07T13:22:54.000Z')
      });
      monitor.tradeLatencies.should.match({
        clientLatency: {
          '1h': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          },
          '1d': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          },
          '1w': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          }
        },
        serverLatency: {
          '1h': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          },
          '1d': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          },
          '1w': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          }
        },
        brokerLatency: {
          '1h': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          },
          '1d': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          },
          '1w': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          }
        }
      });
    });

  });

  /**
   * @test {LatencyMonitor#onUpdate}
   */
  describe('onUpdate', () => {

    /**
     * @test {LatencyMonitor#onUpdate}
     * @test {LatencyMonitor#updateLatencies}
     */
    it('should process update latencies', async () => {
      monitor.onUpdate('accountId', {
        eventGenerated: new Date('2020-12-07T13:22:48.000Z'),
        serverProcessingStarted: new Date('2020-12-07T13:22:49.000Z'),
        serverProcessingFinished: new Date('2020-12-07T13:22:51.000Z'),
        clientProcessingFinished: new Date('2020-12-07T13:22:54.000Z')
      });
      monitor.updateLatencies.should.match({
        brokerLatency: {
          '1h': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          },
          '1d': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          },
          '1w': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          }
        },
        serverLatency: {
          '1h': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          },
          '1d': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          },
          '1w': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          }
        },
        clientLatency: {
          '1h': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          },
          '1d': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          },
          '1w': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          }
        }
      });
    });

  });

  /**
   * @test {LatencyMonitor#onSymbolPrice}
   */
  describe('onSymbolPrice', () => {

    /**
     * @test {LatencyMonitor#onSymbolPrice}
     * @test {LatencyMonitor#priceLatencies}
     */
    it('should process price streaming latencies', async () => {
      monitor.onSymbolPrice('accountId', 'EURUSD', {
        eventGenerated: new Date('2020-12-07T13:22:48.000Z'),
        serverProcessingStarted: new Date('2020-12-07T13:22:49.000Z'),
        serverProcessingFinished: new Date('2020-12-07T13:22:51.000Z'),
        clientProcessingFinished: new Date('2020-12-07T13:22:54.000Z')
      });
      monitor.priceLatencies.should.match({
        brokerLatency: {
          '1h': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          },
          '1d': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          },
          '1w': {
            p50: 1000,
            p75: 1000,
            p90: 1000,
            p95: 1000,
            p98: 1000,
            avg: 1000,
            count: 1,
            min: 1000,
            max: 1000
          }
        },
        serverLatency: {
          '1h': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          },
          '1d': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          },
          '1w': {
            p50: 2000,
            p75: 2000,
            p90: 2000,
            p95: 2000,
            p98: 2000,
            avg: 2000,
            count: 1,
            min: 2000,
            max: 2000
          }
        },
        clientLatency: {
          '1h': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          },
          '1d': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          },
          '1w': {
            p50: 3000,
            p75: 3000,
            p90: 3000,
            p95: 3000,
            p98: 3000,
            avg: 3000,
            count: 1,
            min: 3000,
            max: 3000
          }
        }
      });
    });

  });

  /**
   * @test {LatencyMonitor#onResponse}
   */
  describe('onResponse', () => {

    /**
     * @test {LatencyMonitor#onResponse}
     * @test {LatencyMonitor#requestLatencies}
     */
    it('should process request latencies', async () => {
      monitor.onResponse('accountId', 'getSymbolPrice', {
        clientProcessingStarted: new Date('2020-12-07T13:22:48.500Z'),
        serverProcessingStarted: new Date('2020-12-07T13:22:49.000Z'),
        serverProcessingFinished: new Date('2020-12-07T13:22:51.000Z'),
        clientProcessingFinished: new Date('2020-12-07T13:22:51.500Z')
      });
      monitor.requestLatencies.should.match({
        getSymbolPrice: {
          clientLatency: {
            '1h': {
              p50: 1000,
              p75: 1000,
              p90: 1000,
              p95: 1000,
              p98: 1000,
              avg: 1000,
              count: 1,
              min: 1000,
              max: 1000
            },
            '1d': {
              p50: 1000,
              p75: 1000,
              p90: 1000,
              p95: 1000,
              p98: 1000,
              avg: 1000,
              count: 1,
              min: 1000,
              max: 1000
            },
            '1w': {
              p50: 1000,
              p75: 1000,
              p90: 1000,
              p95: 1000,
              p98: 1000,
              avg: 1000,
              count: 1,
              min: 1000,
              max: 1000
            }
          },
          serverLatency: {
            '1h': {
              p50: 2000,
              p75: 2000,
              p90: 2000,
              p95: 2000,
              p98: 2000,
              avg: 2000,
              count: 1,
              min: 2000,
              max: 2000
            },
            '1d': {
              p50: 2000,
              p75: 2000,
              p90: 2000,
              p95: 2000,
              p98: 2000,
              avg: 2000,
              count: 1,
              min: 2000,
              max: 2000
            },
            '1w': {
              p50: 2000,
              p75: 2000,
              p90: 2000,
              p95: 2000,
              p98: 2000,
              avg: 2000,
              count: 1,
              min: 2000,
              max: 2000
            }
          }
        }
      });
    });

  });

});
