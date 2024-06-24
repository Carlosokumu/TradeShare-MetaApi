import MetaAPI from '../index';
import sinon from 'sinon';
require('dotenv').config();
const token = process.env.TOKEN;
let login = process.env.LOGIN_MT4;
let password = process.env.PASSWORD_MT4;
let serverName = process.env.SERVER_MT4 || 'Tradeview-Demo';
let brokerSrvFile = process.env.PATH_TO_BROKER_SRV || './lib/integration-tests/files/tradeview-demo.broker.srv';
const api = new MetaAPI(token, {application: 'MetaApi', domain: 'project-stock.v3.agiliumlabs.cloud'});

describe('MT4 sync positions test', () => {

  async function checkPositions(streamingConnection, rpcConnection) {
    return {local: streamingConnection.terminalState.positions.length,
      real: (await rpcConnection.getPositions()).length};
  }

  // eslint-disable-next-line max-statements
  it('should show correct positions amount after opening and closing', async function() {
    if(token && login) {
      const profiles = await api.provisioningProfileApi.getProvisioningProfiles();
      this.timeout(600000);
      let profile = profiles.find(p => p.name === serverName);
      if (!profile) {
        profile = await api.provisioningProfileApi.createProvisioningProfile({
          name: serverName,
          version: 4,
          brokerTimezone: 'EET',
          brokerDSTSwitchTimezone: 'EET'
        });
        await profile.uploadFile('broker.srv', brokerSrvFile);
      }
      if (profile && profile.status === 'new') {
        await profile.uploadFile('broker.srv', brokerSrvFile);
      }
      let accounts = await api.metatraderAccountApi.getAccounts();
      let account = accounts.find(a => a.login === login && a.type === 'cloud-g2');
      if (!account) {
        account = await api.metatraderAccountApi.createAccount({
          name: 'Test account-mt4',
          type: 'cloud-g2',
          login: login,
          password: password,
          server: serverName,
          provisioningProfileId: profile.id,
          application: 'MetaApi',
          magic: 1000
        });
      }
      await account.deploy();
      await account.waitConnected();
      const streamingConnection = account.getStreamingConnection();
      const rpcConnection = account.getRPCConnection();
      await streamingConnection.connect();
      await streamingConnection.waitSynchronized({timeoutInSeconds: 600}); 
      await rpcConnection.waitSynchronized();
      const startPositions = streamingConnection.terminalState.positions.length;
      const positionIds = [];
      for (let i = 0; i < 10; i++) {
        let result = await streamingConnection.createMarketBuyOrder('GBPUSD', 0.01, 0.9, 2.0); 
        positionIds.push(result.positionId);
        await new Promise(res => setTimeout(res, 200));
      }
      await new Promise(res => setTimeout(res, 200));
      let positions = await checkPositions(streamingConnection, rpcConnection);
      sinon.assert.match(positions.local, startPositions + 10);
      sinon.assert.match(positions.real, startPositions + 10);
      await new Promise(res => setTimeout(res, 5000));
      await Promise.all(positionIds.map(async id => {
        await streamingConnection.closePosition(id);
      }));
      await new Promise(res => setTimeout(res, 1000));
      await Promise.all(positionIds.map(async id => {
        try {
          await rpcConnection.getPosition(id);
          sinon.assert.fail();
        } catch(err) { //eslint-ignore-line
        }
      }));
      positions = await checkPositions(streamingConnection, rpcConnection);
      sinon.assert.match(positions.local, startPositions);
      sinon.assert.match(positions.real, startPositions);
      await account.undeploy();
    }
  });
});
