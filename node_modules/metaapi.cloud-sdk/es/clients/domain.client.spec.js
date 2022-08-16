'use strict';

import HttpClient from './httpClient';
import sinon from 'sinon';
import DomainClient from './domain.client';
  
/**
 * @test {DomainClient}
 */
describe('DomainClient', () => {

  const token = 'header.payload.sign';
  const host = 'https://mt-client-api-v1';
  const region = 'vint-hill';
  let expected;
  let hostData;
  let httpClient = new HttpClient();
  let domainClient;
  let sandbox;
  let requestStub;
  let clock;
 
  before(() => {
    sandbox = sinon.createSandbox();
  });
 
  beforeEach(() => {
    domainClient = new DomainClient(httpClient, token);
    expected = 'https://mt-client-api-v1.vint-hill.agiliumtrade.ai';
    hostData = {
      url: 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai',
      hostname: 'mt-client-api-v1',
      domain: 'agiliumtrade.ai'
    };
    requestStub = sandbox.stub(httpClient, 'request').resolves(hostData);
    clock = sandbox.useFakeTimers({
      shouldAdvanceTime: true,
      now: new Date('2020-10-05T07:00:00.000Z')
    });
  });
 
  afterEach(() => {
    sandbox.restore();
    clock.restore();
  });
 
  /**
   * @test {DomainClient#getUrl}
   */
  it('should return url', async () => {
    const url = await domainClient.getUrl(host, region);
    url.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt-client-api',
      method: 'GET',
      json: true,
      headers: {
        'auth-token': token
      }
    }, '_updateDomain');
  });

  /**
   * @test {DomainClient#getUrl}
   */
  it('should return cached url if requested again', async () => {
    const url = await domainClient.getUrl(host, region);
    url.should.equal(expected);
    const url2 = await domainClient.getUrl(host, region);
    url2.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt-client-api',
      method: 'GET',
      json: true,
      headers: {
        'auth-token': token
      }
    }, '_updateDomain');
  });

  /**
   * @test {DomainClient#getUrl}
   */
  it('should make a new request if cache expired', async () => {
    const url = await domainClient.getUrl(host, region);
    url.should.equal(expected);
    await clock.tickAsync(11 * 60 * 1000);
    const url2 = await domainClient.getUrl(host, region);
    url2.should.equal(expected);
    sinon.assert.calledTwice(httpClient.request);
  });

  /**
   * @test {DomainClient#getUrl}
   */
  it('should wait for promise if url is being requested', async () => {
    requestStub.callsFake(async (arg) => {
      await new Promise(res => setTimeout(res, 50));
      return hostData;
    });

    let urls = await Promise.all([domainClient.getUrl(host, region),
      domainClient.getUrl(host, region)]);
    urls[0].should.equal(expected);
    urls[1].should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt-client-api',
      method: 'GET',
      json: true,
      headers: {
        'auth-token': token
      }
    }, '_updateDomain');
  });

  /**
   * @test {DomainClient#getUrl}
   */
  it('should retry request if received error', async () => {
    let callNumber = 0;
    requestStub.callsFake(async (arg) => {
      await new Promise(res => setTimeout(res, 50));
      callNumber++;
      if(callNumber < 3) {
        throw new Error('test');
      } else {
        return hostData;
      }
    });
    
    let responses = [domainClient.getUrl(host, region),
      domainClient.getUrl(host, region)];
    await clock.tickAsync(6000);
    responses = [await responses[0], await responses[1]];
    responses[0].should.equal(expected);
    responses[1].should.equal(expected);
    sinon.assert.callCount(httpClient.request, 3);
  });

  /**
   * @test {DomainClient#getSettings}
   */
  it('should return domain settings', async () => {
    const settings = await domainClient.getSettings();
    sinon.assert.match(settings, {
      hostname: 'mt-client-api-v1',
      domain: 'agiliumtrade.ai'
    });
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/servers/mt-client-api',
      method: 'GET',
      json: true,
      headers: {
        'auth-token': token
      }
    }, '_updateDomain');
  });

});
