'use strict';

import HttpClient from '../httpClient';
import sinon from 'sinon';
import ExpertAdvisorClient from './expertAdvisor.client';

const provisioningApiUrl = 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

/**
 * @test {ExpertAdvisorClient}
 */
describe('ExpertAdvisorClient', () => {

  let expertAdvisorClient;
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
      domain: 'agiliumtrade.agiliumtrade.ai'
    };
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    requestStub = sandbox.stub(httpClient, 'request');
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {ExpertAdvisorClient#getExpertAdvisors}
   */
  it('should retrieve expert advisors from API', async () => {
    const expected = [{
      expertId: 'my-ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    }];
    requestStub.resolves(expected);
    let expertAdvisors = await expertAdvisorClient.getExpertAdvisors('id');
    expertAdvisors.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getExpertAdvisors');
  });

  /**
   * @test {ExpertAdvisorClient#getExpertAdvisors}
   */
  it('should not retrieve expert advisors from API with account token', async () => {
    domainClient.token = 'token';
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    try {
      await expertAdvisorClient.getExpertAdvisors('id');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getExpertAdvisors method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ExpertAdvisorClient#getExpertAdvisor}
   */
  it('should retrieve expert advisor from API', async () => {
    let expected = {
      expertId: 'my-ea',
      period: '1H',
      symbol: 'EURUSD',
      fileUploaded: false
    };
    requestStub.resolves(expected);
    let advisor = await expertAdvisorClient.getExpertAdvisor('id', 'my-ea');
    advisor.should.equal(expected);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
      method: 'GET',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'getExpertAdvisor');
  });

  /**
   * @test {ExpertAdvisorClient#getExpertAdvisor}
   */
  it('should not retrieve expert advisor from API with account token', async () => {
    domainClient.token = 'token';
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    try {
      await expertAdvisorClient.getExpertAdvisor('id', 'my-ea');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke getExpertAdvisor method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ExpertAdvisorClient#deleteExpertAdvisor}
   */
  it('should delete expert advisor via API', async () => {
    await expertAdvisorClient.deleteExpertAdvisor('id', 'my-ea');
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
      method: 'DELETE',
      headers: {
        'auth-token': token
      },
      json: true,
    }, 'deleteExpertAdvisor');
  });

  /**
   * @test {ExpertAdvisorClient#deleteExpertAdvisor}
   */
  it('should not delete expert advisor from API with account token', async () => {
    domainClient.token = 'token';
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    try {
      await expertAdvisorClient.deleteExpertAdvisor('id', 'my-ea');
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke deleteExpertAdvisor method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ExpertAdvisorClient#updateExpertAdvisor}
   */
  it('should update expert advisor via API', async () => {
    await expertAdvisorClient.updateExpertAdvisor('id', 'my-ea', {
      preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
      period: '15m',
      symbol: 'EURUSD'
    });
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      json: true,
      body: {
        preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
        period: '15m',
        symbol: 'EURUSD'
      }
    }, 'updateExpertAdvisor');
  });

  /**
   * @test {ExpertAdvisorClient#updateExpertAdvisor}
   */
  it('should not update expert advisor via API with account token', async () => {
    domainClient.token = 'token';
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    try {
      await expertAdvisorClient.updateExpertAdvisor('id', 'my-ea', {
        preset: 'a2V5MT12YWx1ZTEKa2V5Mj12YWx1ZTIKa2V5Mz12YWx1ZTMKc3VwZXI9dHJ1ZQ==',
        period: '15m',
        symbol: 'EURUSD'
      });
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke updateExpertAdvisor method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

  /**
   * @test {ExpertAdvisorClient#uploadExpertAdvisorFile}
   */
  it('should upload file to a expert advisor via API', async () => {
    let file = Buffer.from('test', 'utf8');
    await expertAdvisorClient.uploadExpertAdvisorFile('id', 'my-ea', file);
    sinon.assert.calledOnceWithExactly(httpClient.request, {
      url: `${provisioningApiUrl}/users/current/accounts/id/expert-advisors/my-ea/file`,
      method: 'PUT',
      headers: {
        'auth-token': token
      },
      formData: {
        file
      },
      json: true,
    }, 'uploadExpertAdvisorFile');
  });

  /**
   * @test {ExpertAdvisorClient#uploadExpertAdvisorFile}
   */
  it('should not upload file to an expert advisor via API with account token', async () => {
    domainClient.token = 'token';
    expertAdvisorClient = new ExpertAdvisorClient(httpClient, domainClient);
    try {
      let file = Buffer.from('test', 'utf8');
      await expertAdvisorClient.uploadExpertAdvisorFile('id', 'my-ea', file);
      sinon.assert.fail();
    } catch (error) {
      error.message.should.equal(
        'You can not invoke uploadExpertAdvisorFile method, because you have connected with account access token. ' +
        'Please use API access token from https://app.metaapi.cloud/token page to invoke this method.'
      );
    }
  });

});
