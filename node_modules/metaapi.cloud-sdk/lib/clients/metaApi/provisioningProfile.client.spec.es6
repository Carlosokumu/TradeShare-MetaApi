'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import ProvisioningProfileClient from './provisioningProfile.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {ProvisioningProfileClient}
 */
describe('ProvisioningProfileClient', () => {

  let provisioningClient;
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
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {ProvisioningProfileClient#getProvisioningProfiles}
   */
  it('should retrieve provisioning profiles from API', async () => {
    let expected = [{
      _id: 'id',
      name: 'name',
      version: 4,
      status: 'active'
    }];
    requestStub.resolves(expected);
    let profiles = await provisioningClient.getProvisioningProfiles(5, 'active');
    profiles.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles`,
      method: 'GET',
      qs: {
        version: 5,
        status: 'active'
      },
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getProvisioningProfiles');
  });

  /**
   * @test {MetatraderAccountClient#getProvisioningProfiles}
   */
  it('should not retrieve provisioning profiles from API with account token', async () => {
    domainClient.token = 'token';
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    try {
      await provisioningClient.getProvisioningProfiles(5, 'active');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getProvisioningProfiles method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#getProvisioningProfile}
   */
  it('should retrieve provisioning profile from API', async () => {
    let expected = {
      _id: 'id',
      name: 'name',
      version: 4,
      status: 'active'
    };
    requestStub.resolves(expected);
    let profile = await provisioningClient.getProvisioningProfile('id');
    profile.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles/id`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getProvisioningProfile');
  });

  /**
   * @test {MetatraderAccountClient#getProvisioningProfile}
   */
  it('should not retrieve provisioning profile from API with account token', async () => {
    domainClient.token = 'token';
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    try {
      await provisioningClient.getProvisioningProfile('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#createProvisioningProfile}
   */
  it('should create provisioning profile via API', async () => {
    let expected = {
      id: 'id'
    };
    let profile = {
      name: 'name',
      version: 4
    };
    requestStub.resolves(expected);
    let id = await provisioningClient.createProvisioningProfile(profile);
    id.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles`,
      method: 'POST',
      body: profile,
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'createProvisioningProfile');
  });

  /**
   * @test {MetatraderAccountClient#createProvisioningProfile}
   */
  it('should not create provisioning profile via API with account token', async () => {
    domainClient.token = 'token';
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    try {
      await provisioningClient.createProvisioningProfile({});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke createProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#uploadProvisioningProfileFile}
   */
  it('should upload file to a provisioning profile via API', async () => {
    let file = Buffer.from('test', 'utf8');
    await provisioningClient.uploadProvisioningProfileFile('id', 'servers.dat', file);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles/id/servers.dat`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      formData: { 
        file: { 
          options: { 
            filename: 'serverFile' 
          }, 
          value: file 
        } 
      },
      json: true,
    }, 'uploadProvisioningProfileFile');
  });

  /**
   * @test {MetatraderAccountClient#uploadProvisioningProfileFile}
   */
  it('should not upload provisioning profile file via API with account token', async () => {
    domainClient.token = 'token';
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    try {
      await provisioningClient.uploadProvisioningProfileFile('id', 'servers.dat', {});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke uploadProvisioningProfileFile method, because you have connected with account access' +
        ' token. Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#deleteProvisioningProfile}
   */
  it('should delete provisioning profile via API', async () => {
    await provisioningClient.deleteProvisioningProfile('id');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles/id`,
      method: 'DELETE',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deleteProvisioningProfile');
  });

  /**
   * @test {MetatraderAccountClient#deleteProvisioningProfile}
   */
  it('should not delete provisioning profile via API with account token', async () => {
    domainClient.token = 'token';
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    try {
      await provisioningClient.deleteProvisioningProfile('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deleteProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ProvisioningProfileClient#updateProvisioningProfile}
   */
  it('should update provisioning profile via API', async () => {
    await provisioningClient.updateProvisioningProfile('id', {name: 'new name'});
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/provisioning-profiles/id`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      json: true,
      body: {
        name: 'new name'
      }
    }, 'updateProvisioningProfile');
  });

  /**
   * @test {MetatraderAccountClient#updateProvisioningProfile}
   */
  it('should not update provisioning profile via API with account token', async () => {
    domainClient.token = 'token';
    provisioningClient = new ProvisioningProfileClient(httpClient, domainClient);
    try {
      await provisioningClient.updateProvisioningProfile('id', {name: 'new name'});
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke updateProvisioningProfile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
