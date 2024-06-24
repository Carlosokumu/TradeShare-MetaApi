'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import HistoricalMarketDataClient from './historicalMarketData.client';

const marketDataClientApiUrl = 'https://mt-market-data-client-api-v1.vint-hill.agiliumlabs.cloud';

/**
 * @test {HistoricalMarketDataClient}
 */
describe('HistoricalMarketDataClient', () => {

  let client;
  const token = 'header.payload.sign';
  let httpClient = new HttpClient();
  let domainClient;
  let sandbox;
  let requestStub;
  let marketDataStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    domainClient = {
      token,
      domain: 'agiliumtrade.agiliumtrade.ai',
      getUrl: () => {}
    };
    client = new HistoricalMarketDataClient(httpClient, domainClient);
    requestStub = sandbox.stub(httpClient, 'request');
    sandbox.stub(domainClient, 'getUrl').resolves(marketDataClientApiUrl);
    requestStub.withArgs({
      url: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/regions',
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }).resolves(['vint-hill', 'us-west'])
      .withArgs({
        url: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt-client-api',
        method: 'GET',
        headers: {
          'auth-token': token
        },
        json: true,
      }).resolves({domain: 'agiliumlabs.cloud'});
    marketDataStub = requestStub;
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {HistoricalMarketDataClient#getHistoricalCandles}
   */
  it('should download historical candles from API', async () => {
    let expected = [{
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
    marketDataStub.resolves(expected);
    let candles = await client.getHistoricalCandles('accountId', 'vint-hill', 'AUDNZD', '15m',
      new Date('2020-04-07T03:45:00.000Z'), 1);
    candles.should.equal(expected);
    sinon.assert.calledWith(httpClient.request, {
      url: `${marketDataClientApiUrl}/users/current/accounts/accountId/historical-market-data/symbols/AUDNZD/` +
        'timeframes/15m/candles',
      method: 'GET',
      qs: {
        startTime: new Date('2020-04-07T03:45:00.000Z'),
        limit: 1
      },
      headers: {
        'auth-token': token
      },
      json: true
    }, 'getHistoricalCandles');
  });

  /**
   * @test {HistoricalMarketDataClient#getHistoricalCandles}
   */
  it('should download historical candles from API for symbol with special characters', async () => {
    let expected = [{
      symbol: 'GBPJPY#',
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
    marketDataStub.resolves(expected);
    let candles = await client.getHistoricalCandles('accountId', 'vint-hill', 'GBPJPY#', '15m',
      new Date('2020-04-07T03:45:00.000Z'), 1);
    candles.should.equal(expected);
    sinon.assert.calledWith(httpClient.request, {
      url: `${marketDataClientApiUrl}/users/current/accounts/accountId/historical-market-data/symbols/GBPJPY%23/` +
          'timeframes/15m/candles',
      method: 'GET',
      qs: {
        startTime: new Date('2020-04-07T03:45:00.000Z'),
        limit: 1
      },
      headers: {
        'auth-token': token
      },
      json: true
    }, 'getHistoricalCandles');
  });
  
  /**
   * @test {HistoricalMarketDataClient#getHistoricalTicks}
   */
  it('should download historical ticks from API', async () => {
    let expected = [{
      symbol: 'AUDNZD',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      bid: 1.05297,
      ask: 1.05309,
      last: 0.5298,
      volume: 0.13,
      side: 'buy'
    }];
    requestStub.resolves(expected);
    let ticks = await client.getHistoricalTicks('accountId', 'vint-hill', 'AUDNZD', 
      new Date('2020-04-07T03:45:00.000Z'), 0, 1);
    ticks.should.equal(expected);
    sinon.assert.calledWith(httpClient.request, {
      url: `${marketDataClientApiUrl}/users/current/accounts/accountId/historical-market-data/symbols/AUDNZD/ticks`,
      method: 'GET',
      qs: {
        startTime: new Date('2020-04-07T03:45:00.000Z'),
        offset: 0,
        limit: 1
      },
      headers: {
        'auth-token': token
      },
      json: true
    }, 'getHistoricalTicks');
  });

  /**
   * @test {HistoricalMarketDataClient#getHistoricalTicks}
   */
  it('should download historical ticks from API for symbol with special characters', async () => {
    let expected = [{
      symbol: 'GBPJPY#',
      time: new Date('2020-04-07T03:45:00.000Z'),
      brokerTime: '2020-04-07 06:45:00.000',
      bid: 1.05297,
      ask: 1.05309,
      last: 0.5298,
      volume: 0.13,
      side: 'buy'
    }];
    requestStub.resolves(expected);
    let ticks = await client.getHistoricalTicks('accountId', 'vint-hill', 'GBPJPY#',
      new Date('2020-04-07T03:45:00.000Z'), 0, 1);
    ticks.should.equal(expected);
    sinon.assert.calledWith(httpClient.request, {
      url: `${marketDataClientApiUrl}/users/current/accounts/accountId/historical-market-data/symbols/GBPJPY%23/ticks`,
      method: 'GET',
      qs: {
        startTime: new Date('2020-04-07T03:45:00.000Z'),
        offset: 0,
        limit: 1
      },
      headers: {
        'auth-token': token
      },
      json: true
    }, 'getHistoricalTicks');
  });

});