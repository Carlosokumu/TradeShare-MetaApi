import MetatraderAccountClient, { AccountsFilter, NewMetatraderAccountDto } from "../clients/metaApi/metatraderAccount.client";
import MetaApiWebsocketClient from "../clients/metaApi/metaApiWebsocket.client";
import ConnectionRegistry from "./connectionRegistry";
import ExpertAdvisorClient from "../clients/metaApi/expertAdvisor.client";
import HistoricalMarketDataClient from "../clients/metaApi/historicalMarketData.client";
import MetatraderAccount from "./metatraderAccount";

/**
 * Exposes MetaTrader account API logic to the consumers
 */
export default class MetatraderAccountApi {
  
  /**
   * Constructs a MetaTrader account API instance
   * @param {MetatraderAccountClient} metatraderAccountClient MetaTrader account REST API client
   * @param {MetaApiWebsocketClient} metaApiWebsocketClient MetaApi websocket client
   * @param {ConnectionRegistry} connectionRegistry metatrader account connection registry
   * @param {ExpertAdvisorClient} expertAdvisorClient expert advisor REST API client
   * @param {HistoricalMarketDataClient} historicalMarketDataClient historical market data HTTP API client
   * @param {string} application application name
   */
  constructor(metatraderAccountClient: MetatraderAccountClient, metaApiWebsocketClient: MetaApiWebsocketClient, connectionRegistry: ConnectionRegistry, expertAdvisorClient: ExpertAdvisorClient, 
    historicalMarketDataClient: HistoricalMarketDataClient, application: string);
  
  /**
   * Retrieves MetaTrader accounts
   * @param {AccountsFilter} accountsFilter optional filter
   * @return {Promise<Array<MetatraderAccount>>} promise resolving with an array of MetaTrader account entities
   */
  getAccounts(accountsFilter: AccountsFilter): Promise<Array<MetatraderAccount>>;
  
  /**
   * Retrieves a MetaTrader account by id
   * @param {string} accountId MetaTrader account id
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  getAccount(accountId: string): Promise<MetatraderAccount>;
  
  /**
   * Retrieves a MetaTrader account by token
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  getAccountByToken(): Promise<MetatraderAccount>;
  
  /**
   * Creates a MetaTrader account
   * @param {NewMetatraderAccountDto} account MetaTrader account data
   * @return {Promise<MetatraderAccount>} promise resolving with MetaTrader account entity
   */
  createAccount(account: NewMetatraderAccountDto): Promise<MetatraderAccount>;
}