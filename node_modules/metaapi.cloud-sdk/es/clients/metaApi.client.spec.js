'use strict';

import {HttpClientMock} from './httpClient';
import MetaApiClient from './metaApi.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {MetaApiClient}
 */
describe('MetaApiClient', () => {

  let apiClient;
  const token = 'token';
  const apiToken = 'header.payload.sign';
  let httpClient = new HttpClientMock(() => 'empty');
  let domainClient;

  beforeEach(() => {
    domainClient = {
      token,
      domain: 'agiliumtrade.agiliumtrade.ai',
      getUrl: () => {}
    };
    apiClient = new MetaApiClient(httpClient, domainClient);
  });

  it('should return account token type', () => {
    apiClient._tokenType.should.equal('account');
  });

  it('should return api token type', () => {
    domainClient.token = apiToken;
    apiClient = new MetaApiClient(httpClient, domainClient);
    apiClient._tokenType.should.equal('api');
  });

  it('should check that current token is not JWT', () => {
    apiClient._isNotJwtToken().should.equal(true);
  });

  it('should check that current token is not account token', () => {
    domainClient.token = apiToken;
    apiClient = new MetaApiClient(httpClient, domainClient);
    apiClient._isNotAccountToken().should.equal(true);
  });

  it('should handle no access error with account token', async () => {
    try {
      await apiClient._handleNoAccessError('methodName');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke methodName method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  it('should handle no access error with api token', async () => {
    domainClient.token = apiToken;
    apiClient = new MetaApiClient(httpClient, domainClient);
    try {
      await apiClient._handleNoAccessError('methodName');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke methodName method, because you have connected with API access token. ' +
        'Please use account access token to invoke this method.'
      );
    }
  });

});