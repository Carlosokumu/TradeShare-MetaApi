'use strict';

import MetaApi from './metaApi/metaApi';
import HistoryStorage from './metaApi/historyStorage';
import MemoryHistoryStorage from './metaApi/memoryHistoryStorage';
import SynchronizationListener from './clients/metaApi/synchronizationListener';
import CopyFactory, {StopoutListener, UserLogListener, TransactionListener} from 'metaapi.cloud-copyfactory-sdk';
import MetaStats from 'metaapi.cloud-metastats-sdk';
import RiskManagement, {DrawdownListener} from 'metaapi.cloud-risk-management-sdk';

export default MetaApi;

export {
  HistoryStorage,
  SynchronizationListener,
  MemoryHistoryStorage,
  CopyFactory,
  StopoutListener,
  UserLogListener,
  TransactionListener,
  MetaStats,
  RiskManagement,
  DrawdownListener
};
