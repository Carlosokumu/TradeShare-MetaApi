'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import MetatraderAccountClient from './metatraderAccount.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {MetatraderAccountClient}
 */
// eslint-disable-next-line max-statements
describe('MetatraderAccountClient', () => {

  let accountClient;
  const token = 'header.payload.sign';
  let httpClient = new HttpClient();
  let domainClient;
  let sandbox;
  let requestStub;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  beforeEach(() => {
    domainClient = {
      token,
      domain: 'agiliumtrade.agiliumtrade.ai',
      getUrl: () => {}
    };
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {MetatraderAccountClient#getAccounts}
   */
  it('should retrieve MetaTrader accounts from API', async () => {
    let expected = [{
      _id: '1eda642a-a9a3-457c-99af-3bc5e8d5c4c9',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      tags: ['tag1', 'tag2']
    }];
    requestStub.resolves(expected);
    let accounts = await accountClient.getAccounts({
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076'
    });
    accounts.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts`,
      method: 'GET',
      qs: {
        provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076'
      },
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getAccounts');
  });

  /**
   * @test {MetatraderAccountClient#getAccounts}
   */
  it('should not retrieve MetaTrader accounts from API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.getAccounts('f9ce1f12-e720-4b9a-9477-c2d4cb25f076');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getAccounts method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#getAccount}
   */
  it('should retrieve MetaTrader account from API', async () => {
    let expected = {
      _id: 'id',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      tags: ['tag1', 'tag2']
    };
    requestStub.resolves(expected);
    let account = await accountClient.getAccount('id');
    account.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getAccount');
  });

  /**
   * @test {MetatraderAccountClient#getAccountReplica}
   */
  it('should retrieve MetaTrader account replica from API', async () => {
    let expected = {
      _id: 'idReplica',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud',
      tags: ['tag1', 'tag2']
    };
    requestStub.resolves(expected);
    let account = await accountClient.getAccountReplica('id', 'idReplica');
    account.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/replicas/idReplica`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#getAccountByToken}
   */
  it('should retrieve MetaTrader account by token from API', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    let expected = {
      _id: 'id',
      login: '50194988',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      connectionStatus: 'DISCONNECTED',
      state: 'DEPLOYED',
      type: 'cloud'
    };
    requestStub.resolves(expected);
    let account = await accountClient.getAccountByToken();
    account.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accessToken/token`,
      method: 'GET',
      json: true
    }, 'getAccountByToken');
  });

  /**
   * @test {MetatraderAccountClient#createAccount}
   */
  it('should not retrieve MetaTrader account by token via API with api token', async () => {
    domainClient.token = token;
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.getAccountByToken();
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getAccountByToken method, because you have connected with API access token. ' +
        'Please use account access token to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#createAccount}
   */
  it('should create MetaTrader account via API', async () => {
    let expected = {
      id: 'id'
    };
    let account = {
      login: '50194988',
      password: 'Test1234',
      name: 'mt5a',
      server: 'ICMarketsSC-Demo',
      provisioningProfileId: 'f9ce1f12-e720-4b9a-9477-c2d4cb25f076',
      magic: 123456,
      application: 'MetaApi',
      type: 'cloud',
      tags: ['tag1']
    };
    requestStub.resolves(expected);
    let id = await accountClient.createAccount(account);
    id.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts`,
      method: 'POST',
      body: account,
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'createAccount');
  });

  /**
   * @test {MetatraderAccountClient#createAccount}
   */
  it('should not create MetaTrader account via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.createAccount({});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#createAccountReplica}
   */
  it('should create MetaTrader account replica via API', async () => {
    let expected = {
      id: 'id'
    };
    let replica = {
      magic: 123456,
      symbol: 'EURUSD'
    };
    requestStub.resolves(expected);
    let id = await accountClient.createAccountReplica('accountId', replica);
    id.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accountId/replicas`,
      method: 'POST',
      body: replica,
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'createAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#createAccountReplica}
   */
  it('should not create MetaTrader account replica via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.createAccountReplica('accountId', {});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createAccountReplica method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#deployAccount}
   */
  it('should deploy MetaTrader account via API', async () => {
    await accountClient.deployAccount('id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/deploy`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deployAccount');
  });

  /**
   * @test {MetatraderAccountClient#deployAccount}
   */
  it('should not deploy MetaTrader account via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.deployAccount('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deployAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#deployAccountReplica}
   */
  it('should deploy MetaTrader account replica via API', async () => {
    await accountClient.deployAccountReplica('accountId', 'id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accountId/replicas/id/deploy`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deployAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#deployAccountReplica}
   */
  it('should not deploy MetaTrader account replica via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.deployAccountReplica('accountId', 'id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deployAccountReplica method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#undeployAccount}
   */
  it('should undeploy MetaTrader account via API', async () => {
    await accountClient.undeployAccount('id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/undeploy`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'undeployAccount');
  });

  /**
   * @test {MetatraderAccountClient#undeployAccount}
   */
  it('should not undeploy MetaTrader account via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.undeployAccount('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke undeployAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#undeployAccountReplica}
   */
  it('should undeploy MetaTrader account replica via API', async () => {
    await accountClient.undeployAccountReplica('accountId', 'id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accountId/replicas/id/undeploy`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'undeployAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#undeployAccountReplica}
   */
  it('should not undeploy MetaTrader account replica via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.undeployAccountReplica('accountId', 'id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke undeployAccountReplica method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#redeployAccount}
   */
  it('should redeploy MetaTrader account via API', async () => {
    await accountClient.redeployAccount('id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/redeploy`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'redeployAccount');
  });

  /**
   * @test {MetatraderAccountClient#redeployAccount}
   */
  it('should not redeploy MetaTrader account via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.redeployAccount('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke redeployAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#redeployAccountReplica}
   */
  it('should redeploy MetaTrader account replica via API', async () => {
    await accountClient.redeployAccountReplica('accountId', 'id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accountId/replicas/id/redeploy`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'redeployAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#redeployAccountReplica}
   */
  it('should not redeploy MetaTrader account replica via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.redeployAccountReplica('accountId', 'id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke redeployAccountReplica method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#deleteAccount}
   */
  it('should delete MetaTrader account via API', async () => {
    await accountClient.deleteAccount('id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id`,
      method: 'DELETE',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deleteAccount');
  });

  /**
   * @test {MetatraderAccountClient#deleteAccount}
   */
  it('should not delete MetaTrader account via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.deleteAccount('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deleteAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#deleteAccountReplica}
   */
  it('should delete MetaTrader account replica via API', async () => {
    await accountClient.deleteAccountReplica('accountId', 'id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accountId/replicas/id`,
      method: 'DELETE',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deleteAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#deleteAccountReplica}
   */
  it('should not delete MetaTrader account replica via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.deleteAccountReplica('accountId', 'id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deleteAccountReplica method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#updateAccount}
   */
  it('should update MetaTrader account via API', async () => {
    await accountClient.updateAccount('id', {
      name: 'new account name',
      password: 'new_password007',
      server: 'ICMarketsSC2-Demo',
      tags: ['tag1']
    });
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      json: true,
      body: {
        name: 'new account name',
        password: 'new_password007',
        server: 'ICMarketsSC2-Demo',
        tags: ['tag1']
      }
    }, 'updateAccount');
  });

  /**
   * @test {MetatraderAccountClient#updateAccount}
   */
  it('should not update MetaTrader account via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.updateAccount('id', {});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke updateAccount method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#updateAccountReplica}
   */
  it('should update MetaTrader account replica via API', async () => {
    await accountClient.updateAccountReplica('accountId', 'id', {
      magic: 0,
      tags: ['tag1']
    });
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/accountId/replicas/id`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      json: true,
      body: {
        magic: 0,
        tags: ['tag1']
      }
    }, 'updateAccountReplica');
  });

  /**
   * @test {MetatraderAccountClient#updateAccountReplica}
   */
  it('should not update MetaTrader account replica via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.updateAccountReplica('accountId', 'id', {});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke updateAccountReplica method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {MetatraderAccountClient#increaseReliability}
   */
  it('should increase MetaTrader account reliability via API', async () => {
    await accountClient.increaseReliability('id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/increase-reliability`,
      method: 'POST',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'increaseReliability');
  });
  
  /**
     * @test {MetatraderAccountClient#increaseReliability}
     */
  it('should not increase MetaTrader account reliability via API with account token', async () => {
    domainClient.token = 'token';
    accountClient = new MetatraderAccountClient(httpClient, domainClient);
    try {
      await accountClient.increaseReliability('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke increaseReliability method, because you have connected with account access token. ' +
          'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
