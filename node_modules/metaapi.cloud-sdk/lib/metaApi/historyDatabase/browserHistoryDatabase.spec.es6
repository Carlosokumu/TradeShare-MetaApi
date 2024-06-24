'use strict';

import should from 'should';
require('fake-indexeddb/auto');
import {deleteDB} from 'idb';
import BrowserHistoryDatabase from './browserHistoryDatabase';

describe('BrowserHistoryDatabase', () => {

  let db;

  before(async () => {
    db = BrowserHistoryDatabase.getInstance();
  });

  beforeEach(async () => {
    await deleteDB('metaapi');
  });

  afterEach(async () => {
    await deleteDB('metaapi');
  });

  it('should clear db', async () => {
    await db.flush('accountId', 'MetaApi', [{id: '2'}], [{id: '1'}]);
    await db.clear('accountId', 'MetaApi');
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([]);
    historyOrders.should.match([]);
  });

  it('should record and then read db contents', async () => {
    await db.flush('accountId', 'MetaApi', [{id: '2'}], [{id: '1'}]);
    await db.flush('accountId', 'MetaApi', [{id: '3'}], [{id: '2'}]);
    let {deals, historyOrders} = await db.loadHistory('accountId', 'MetaApi');
    deals.should.match([{id: '1'}, {id: '2'}]);
    historyOrders.should.match([{id: '2'}, {id: '3'}]);
  });
  it('should read db contents only for current account and application', async () => {
    await db.flush('31а3c7b9-958f-4827-96f9-7d296c8ad03e', 'MetaApi', [{id: '4'}], [{id: '5'}]);
    await db.flush('96773bff-27f4-4070-91eg-d6ba828ae9051', 'MetaApi', [{id: '2'}], [{id: '1'}]);
    await db.flush('96773bff-27f4-4070-91eg-d6ba828ae9051', 'MetaApi', [{id: '3'}], [{id: '2'}]);
    let {deals, historyOrders} = await db.loadHistory('31а3c7b9-958f-4827-96f9-7d296c8ad03e', 'MetaApi');
    deals.should.match([{id: '5'}]);
    deals.length.should.eql(1);
    historyOrders.should.match([{id: '4'}]);
  });

});
