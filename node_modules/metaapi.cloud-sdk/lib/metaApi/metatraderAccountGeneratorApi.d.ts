import MetatraderAccountGeneratorClient, { MetatraderAccountCredentialsDto, NewMT4DemoAccount, NewMT4LiveAccount, NewMT5DemoAccount, NewMT5LiveAccount } from "../clients/metaApi/metatraderAccountGenerator.client";
import MetatraderAccountCredentials from "./metatraderAccountCredentials";

/**
 * Exposes MetaTrader account generator API logic to the consumers
 */
export default class MetatraderAccountGeneratorApi {
  
  /**
   * Constructs a MetaTrader account generator API instance
   * @param {MetatraderAccountGeneratorClient} metatraderAccountGeneratorClient MetaTrader account generator REST API
   * client
   */
  constructor(metatraderAccountGeneratorClient: MetatraderAccountGeneratorClient);

  /**
   * Creates new MetaTrader 4 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4DemoAccount/
   * @param {NewMT4DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT4DemoAccount(account: NewMT4DemoAccount, profileId?: string): Promise<MetatraderAccountCredentials>;

  /**
   * Creates new MetaTrader 4 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4LiveAccount/
   * @param {NewMT4LiveAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT4LiveAccount(account: NewMT4LiveAccount, profileId?: string): Promise<MetatraderAccountCredentials>;

  /**
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * @param {NewMT5DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT5DemoAccount(account: NewMT5DemoAccount, profileId?: string): Promise<MetatraderAccountCredentials>;

  /**
   * Creates new MetaTrader 5 live account
   * @param {NewMT5LiveAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentials>} promise resolving with MetaTrader account credentials entity
   */
  createMT5LiveAccount(account: NewMT5LiveAccount, profileId?: string): Promise<MetatraderAccountCredentials>;

}