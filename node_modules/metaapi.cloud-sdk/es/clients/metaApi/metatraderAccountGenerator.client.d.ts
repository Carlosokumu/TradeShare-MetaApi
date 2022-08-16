import MetaApiClient from "../metaApi.client"

/**
 * metaapi.cloud MetaTrader account generator API client
 */
export default class MetatraderAccountGeneratorClient extends MetaApiClient {
  
  /**
   * Creates new MetaTrader 4 demo account
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4DemoAccount/
   * Method is accessible only with API access token
   * @param {NewMT4DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credetials
   */
  createMT4DemoAccount(account: NewMT4DemoAccount, profileId?: string): Promise<MetatraderAccountCredentialsDto>;

  /**
   * Creates new MetaTrader 4 live account
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4LiveAccount/
   * Method is accessible only with API access token
   * @param {NewMT4LiveAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credetials
   */
  createMT4LiveAccount(account: NewMT4LiveAccount, profileId?: string): Promise<MetatraderAccountCredentialsDto>;

  /**
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * Method is accessible only with API access token
   * @param {NewMT5DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credentials
   */
   createMT5DemoAccount(account: NewMT5DemoAccount, profileId?: string): Promise<MetatraderAccountCredentialsDto>;

  /**
   * Creates new MetaTrader 5 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5LiveAccount/
   * Method is accessible only with API access token
   * @param {NewMT5LiveAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credentials
   */
  createMT5LiveAccount(account: NewMT5LiveAccount, profileId?: string): Promise<MetatraderAccountCredentialsDto>;

}

/**
 * New MetaTrader 4 demo account request model
 */
export declare type NewMT4DemoAccount = {

  /**
   * Account type. Available account type values can be found in mobile MT application or in MT terminal downloaded
   * from our broker
   */
  accountType: string,

  /**
   * account balance
   */
  balance: number,

  /**
   * account holder's email
   */
  email: string,

  /**
   * account leverage
   */
  leverage: number,

  /**
   * account holder's name
   */
  name: string,

  /**
   * account holder's phone, in international format
   */
  phone: string,

  /**
   * server name
   */
  serverName: string

}

/**
 * New MetaTrader 4 live account request model
 */
export declare type NewMT4LiveAccount = {

  /**
   * Account type. Available account type values can be found in mobile MT application or in MT terminal downloaded
   * from our broker
   */
  accountType: string,

  /**
   * account holder's address
   */
  address: string,

  /**
   * account holder's city
   */
  city: string,

  /**
   * account holder's country
   */
  country: string,

  /**
   * account holder's email
   */
  email: string,

  /**
   * account leverage
   */
  leverage: number,

  /**
   * account holder's name
   */
  name: string,

  /**
   * account holder's phone, in international format
   */
  phone: string,

  /**
   * server name
   */
  serverName: string,

  /**
   * account holder's state
   */
  state: string,

  /**
   * zip address
   */
  zip: string
}

/**
 * New MetaTrader 5 demo account request model
 */
export declare type NewMT5DemoAccount = {

  /**
   * Account type. Available account type values can be found in mobile MT application or in MT terminal downloaded
   * from our broker
   */
  accountType: string,

  /**
   * account balance
   */
  balance: number,

  /**
   * account holder's email
   */
  email: string,

  /**
   * account leverage
   */
  leverage: number,

  /**
   * account holder's name
   */
  name: string,

  /**
   * account holder's phone, in international format
   */
  phone: string,

  /**
   * server name
   */
  serverName: string

}

/**
 * New MetaTrader 5 live account request model
 */
export declare type NewMT5LiveAccount = {

  /**
   * Account type. Available account type values can be found in mobile MT application or in MT terminal downloaded
   * from our broker
   */
  accountType: string,

  /**
   * account holder's address
   */
  address: string,

  /**
   * account holder's city
   */
  city: string,

  /**
   * account holder's country
   */
  country: string;

  /**
   * account holder's email
   */
  email: string,

  /**
   * account leverage
   */
  leverage: number,

  /**
   * account holder's name
   */
  name: string,

  /**
   * account holder's phone, in international format
   */
  phone: string,

  /**
   * server name
   */
  serverName: string,

  /**
   * account holder's state
   */
  state: string,

  /**
   * zip address
   */
  zip: string
    
}

/**
 * MetaTrader demo account model
 */
export declare type MetatraderAccountCredentialsDto = {

  /**
   * account login
   */
  login: string,

  /**
   * account password
   */
  password: string,

  /**
   * MetaTrader server name
   */
  serverName: string,

  /**
   * account investor (read-only) password
   */
  investorPassword: string
}