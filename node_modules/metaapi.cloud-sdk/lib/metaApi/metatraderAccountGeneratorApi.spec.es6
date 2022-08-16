'use strict';

import should from 'should';
import sinon from 'sinon';
import MetatraderAccountGeneratorApi from './metatraderAccountGeneratorApi';
import MetatraderAccountCredentials from './metatraderAccountCredentials';

/**
 * @test {MetatraderAccountGeneratorApi}
 * @test {MetatraderAccountCredentials}
 */
describe('MetatraderAccountGeneratorApi', () => {

  let sandbox;
  let api;
  let client = {
    createMT4DemoAccount: () => {},
    createMT5DemoAccount: () => {},
    createMT4LiveAccount: () => {},
    createMT5LiveAccount: () => {}
  };

  before(() => {
    api = new MetatraderAccountGeneratorApi(client);
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  /**
   * @test {MetatraderAccountGeneratorApi#createMT4DemoAccount}
   */
  it('should create MT4 demo account', async () => {
    sandbox.stub(client, 'createMT4DemoAccount').resolves({
      login: '12345',
      password: 'qwerty',
      serverName: 'HugosWay-Demo3',
      investorPassword: 'qwerty'
    });
    let newAccountData = {
      accountType: 'type',
      balance: 10,
      email: 'test@test.com',
      leverage: 15,
      serverName: 'HugosWay-Demo3'
    };
    let account = await api.createMT4DemoAccount(newAccountData, 'profileId1');
    account.should.match({login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3',
      investorPassword: 'qwerty'});
    (account instanceof MetatraderAccountCredentials).should.be.true();
    sinon.assert.calledWith(client.createMT4DemoAccount, newAccountData, 'profileId1');
  });

  /**
   * @test {MetatraderAccountGeneratorApi#createMT4LiveAccount}
   */
  it('should create MT4 live account', async () => {
    sandbox.stub(client, 'createMT4LiveAccount').resolves({
      login: '12345',
      password: 'qwerty',
      serverName: 'HugosWay-Live3',
      investorPassword: 'qwerty'
    });
    let newAccountData = {
      accountType: 'type',
      balance: 10,
      email: 'test@test.com',
      leverage: 15,
      serverName: 'HugosWay-Live3'
    };
    let account = await api.createMT4LiveAccount(newAccountData, 'profileId1');
    account.should.match({login: '12345', password: 'qwerty', serverName: 'HugosWay-Live3',
      investorPassword: 'qwerty'});
    (account instanceof MetatraderAccountCredentials).should.be.true();
    sinon.assert.calledWith(client.createMT4LiveAccount, newAccountData, 'profileId1');
  });

  /**
   * @test {MetatraderAccountGeneratorApi#createMT5DemoAccount}
   */
  it('should create MT5 demo account', async () => {
    sandbox.stub(client, 'createMT5DemoAccount').resolves({
      login: '12345',
      password: 'qwerty',
      serverName: 'HugosWay-Demo3',
      investorPassword: 'qwerty'
    });
    let newAccountData = {
      accountType: 'type',
      balance: 15,
      email: 'test@test.com',
      leverage: 20,
      serverName: 'HugosWay-Demo3'
    };
    let account = await api.createMT5DemoAccount(newAccountData, 'profileId2');
    account.should.match({login: '12345', password: 'qwerty', serverName: 'HugosWay-Demo3', 
      investorPassword: 'qwerty'});
    (account instanceof MetatraderAccountCredentials).should.be.true();
    sinon.assert.calledWith(client.createMT5DemoAccount, newAccountData, 'profileId2');
  });

  /**
   * @test {MetatraderAccountGeneratorApi#createMT5LiveAccount}
   */
  it('should create MT5 live account', async () => {
    sandbox.stub(client, 'createMT5LiveAccount').resolves({
      login: '12345',
      password: 'qwerty',
      serverName: 'HugosWay-Live3',
      investorPassword: 'qwerty'
    });
    let newAccountData = {
      accountType: 'type',
      balance: 15,
      email: 'test@test.com',
      leverage: 20,
      serverName: 'HugosWay-Live3'
    };
    let account = await api.createMT5LiveAccount(newAccountData, 'profileId2');
    account.should.match({login: '12345', password: 'qwerty', serverName: 'HugosWay-Live3',
      investorPassword: 'qwerty'});
    (account instanceof MetatraderAccountCredentials).should.be.true();
    sinon.assert.calledWith(client.createMT5LiveAccount, newAccountData, 'profileId2');
  });

});
