'use strict';

import should from 'should';
import fs from 'fs';
import path from 'path';
import FilesystemHistoryDatabase from './filesystemHistoryDatabase';

describe('FilesystemHistoryDatabase', () => {

  let db;

  before(async () => {
    db = FilesystemHistoryDatabase.getInstance();
  });

  beforeEach(async () => {
    await removeDataFolder();
  });

  async function removeDataFolder() {
    if (!fs.existsSync('.metaapi')) {
      return;
    }
    let files = await fs.promises.readdir('.metaapi');
    for (let file of files) {
      if (file === 'logs') {
        let logFiles = await fs.promises.readdir(path.join('.metaapi', 'logs'));
        for (let f of logFiles) {
          await fs.promises.unlink(path.join('.metaapi', 'logs', f));
        }
        await fs.promises.rmdir(path.join('.metaapi', 'logs'));
      } else {
        await fs.promises.unlink(path.join('.metaapi', file));
      }
    }
    await fs.promises.rmdir('.metaapi');
  }

  afterEach(async () => {
    await removeDataFolder();
  });

  it('should read db contents', async () => {
    let dealsData = '{"id":"1"}\n{"id":"2"}\n';
    let historyOrdersData = '{"id":"2"}\n{"id":"3"}\n';
    await fs.promises.mkdir('.metaapi', {recursive: true});
    await fs.promises.writeFile(path.join('.metaapi', 'accountId-MetaApi-deals.bin'), dealsData, 'utf-8');
    await fs.promises.writeFile(path.join('.metaapi', 'accountId-MetaApi-historyOrders.bin'), historyOrdersData,
      'utf-8');
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([{id: '1'}, {id: '2'}]);
    historyOrders.should.match([{id: '2'}, {id: '3'}]);
  });

  it('should clear db', async () => {
    let dealsData = '{"id":"1"}\n{"id":"2"}\n';
    let historyOrdersData = '{"id":"2"}\n{"id":"3"}\n';
    await fs.promises.mkdir('.metaapi', {recursive: true});
    await fs.promises.writeFile(path.join('.metaapi', 'accountId-MetaApi-deals.bin'), dealsData, 'utf-8');
    await fs.promises.writeFile(path.join('.metaapi', 'accountId-MetaApi-historyOrders.bin'), historyOrdersData,
      'utf-8');
    await db.clear('accountId', 'MetaApi');
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([]);
    historyOrders.should.match([]);
  });

  it('should flush to db', async () => {
    await db.flush('accountId', 'MetaApi', [{id: '2'}], [{id: '1'}]);
    await db.flush('accountId', 'MetaApi', [{id: '3'}], [{id: '2'}]);
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([{id: '1'}, {id: '2'}]);
    historyOrders.should.match([{id: '2'}, {id: '3'}]);
  });

});
