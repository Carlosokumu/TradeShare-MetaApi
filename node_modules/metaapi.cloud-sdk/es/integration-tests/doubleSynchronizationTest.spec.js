import MetaAPI from '../index';
import fs from 'fs-extra';
require('dotenv').config();
const token = process.env.TOKEN;
let login = process.env.LOGIN;
let password = process.env.PASSWORD;
let serverName = process.env.SERVER;
let serverDatFile = process.env.PATH_TO_SERVERS_DAT;
const api = new MetaAPI(token, {application: 'MetaApi', domain: 'project-stock.v3.agiliumlabs.cloud'});

describe('MT5 double synchronization test', () => {

  before(async () => {
    await fs.ensureDir('./.metaapi');
  });

  afterEach(async () => {
    await fs.emptyDir('./.metaapi');
  });

  it('should not corrupt files after simultaneous synchronization', async function() {
    if(token) {
      const profiles = await api.provisioningProfileApi.getProvisioningProfiles();
      this.timeout(600000);
      let profile = profiles.find(p => p.name === serverName);
      if (!profile) {
        profile = await api.provisioningProfileApi.createProvisioningProfile({
          name: serverName,
          version: 5
        });
        await profile.uploadFile('servers.dat', serverDatFile);
      }
      if (profile && profile.status === 'new') {
        await profile.uploadFile('servers.dat', serverDatFile);
      }
      let accounts = await api.metatraderAccountApi.getAccounts();
      let account = accounts.find(a => a.login === login && a.type.startsWith('cloud'));
      if (!account) {
        account = await api.metatraderAccountApi.createAccount({
          name: 'Test account',
          type: 'cloud',
          login: login,
          password: password,
          server: serverName,
          provisioningProfileId: profile.id,
          application: 'MetaApi',
          magic: 1000
        });
      }
      let accountCopy = await api.metatraderAccountApi.getAccount(account.id);
      await Promise.all([
        account.deploy(),
        accountCopy.deploy()
      ]);
      await Promise.all([
        account.waitConnected(),
        accountCopy.waitConnected()
      ]);
      let connection = account.getStreamingConnection();
      let connectionCopy = accountCopy.getStreamingConnection();
      await connection.connect();
      await connectionCopy.connect();
      await Promise.all([
        connection.waitSynchronized({timeoutInSeconds: 600}),
        connectionCopy.waitSynchronized({timeoutInSeconds: 600})
      ]);
      await account.undeploy();
      await accountCopy.undeploy();
      api._metaApiWebsocketClient.removeAllListeners();
      JSON.parse(await fs.readFile(`./.metaapi/${account.id}-MetaApi-deals.bin`));
      JSON.parse(await fs.readFile(`./.metaapi/${account.id}-MetaApi-historyOrders.bin`));
    }
  });
});
