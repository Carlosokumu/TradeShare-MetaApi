'use strict';

const isBrowser = process.title === 'browser';

let HistoryDatabase;
if(isBrowser) {
  HistoryDatabase = require('./browserHistoryDatabase').default;
} else {
  HistoryDatabase = require('./filesystemHistoryDatabase').default;
}

export default HistoryDatabase;
