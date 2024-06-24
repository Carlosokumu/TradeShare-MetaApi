'use strict';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud MetaTrader account generator API client
 */
export default class MetatraderAccountGeneratorClient extends MetaApiClient {

  /**
   * New MetaTrader 4 demo account request model
   * @typedef {Object} NewMT4DemoAccount
   * @property {string} accountType account type. Available account type values can be found in mobile MT application or
   * in MT terminal downloaded from our broker
   * @property {number} balance account balance
   * @property {string} email account holder's email
   * @property {number} leverage account leverage
   * @property {string} name account holder's name
   * @property {string} phone account holder's phone, in international format
   * @property {string} serverName server name
   */

  /**
   * New MetaTrader 4 live account request model
   * @typedef {Object} NewMT4LiveAccount
   * @property {string} accountType account type. Available account type values can be found in mobile MT application or
   * in MT terminal downloaded from our broker
   * @property {string} address account holder's address
   * @property {string} city account holder's city
   * @property {string} country account holder's country
   * @property {string} email account holder's email
   * @property {number} leverage account leverage
   * @property {string} name account holder's name
   * @property {string} phone account holder's phone, in international format
   * @property {string} serverName server name
   * @property {string} state account holder's state
   * @property {string} zip zip address
   */

  /**
   * New MetaTrader 5 demo account request model
   * @typedef {Object} NewMT5DemoAccount
   * @property {string} accountType account type. Available account type values can be found in mobile MT application or
   * in MT terminal downloaded from our broker
   * @property {number} balance account balance
   * @property {string} email account holder's email
   * @property {number} leverage account leverage
   * @property {string} name account holder's name
   * @property {string} phone account holder's phone, in international format
   * @property {string} serverName server name
   */

  /**
   * New MetaTrader 5 live account request model
   * @typedef {Object} NewMT5LiveAccount
   * @property {string} accountType account type. Available account type values can be found in mobile MT application or
   * in MT terminal downloaded from our broker
   * @property {string} address account holder's address
   * @property {string} city account holder's city
   * @property {string} country account holder's country
   * @property {string} email account holder's email
   * @property {number} leverage account leverage
   * @property {string} name account holder's name
   * @property {string} phone account holder's phone, in international format
   * @property {string} serverName server name
   * @property {string} state account holder's state
   * @property {string} zip zip address
   */

  /**
   * MetaTrader account credetials model
   * @typedef {Object} MetatraderAccountCredentialsDto
   * @property {String} login account login
   * @property {String} password account password
   * @property {String} serverName MetaTrader server name
   * @property {String} investorPassword account investor (read-only) password
   */

  /**
   * Creates new MetaTrader 4 demo account
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4DemoAccount/
   * Method is accessible only with API access token
   * @param {NewMT4DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credetials
   */
  createMT4DemoAccount(account, profileId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT4DemoAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId || 'default'}/mt4-demo-accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'createMT4DemoAccount');
  }

  /**
   * Creates new MetaTrader 4 live account
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT4LiveAccount/
   * Method is accessible only with API access token
   * @param {NewMT4LiveAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credetials
   */
  createMT4LiveAccount(account, profileId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT4LiveAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId || 'default'}/mt4-live-accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'createMT4LiveAccount');
  }

  /**
   * Creates new MetaTrader 5 demo account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5DemoAccount/
   * Method is accessible only with API access token
   * @param {NewMT5DemoAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credentials
   */
  createMT5DemoAccount(account, profileId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT5DemoAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId || 'default'}/mt5-demo-accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'createMT5DemoAccount');
  }

  /**
   * Creates new MetaTrader 5 live account.
   * See https://metaapi.cloud/docs/provisioning/api/generateAccount/createMT5LiveAccount/
   * Method is accessible only with API access token
   * @param {NewMT5LiveAccount} account account to create
   * @param {string} [profileId] id of the provisioning profile that will be used as the basis for creating this account
   * @return {Promise<MetatraderAccountCredentialsDto>} promise resolving with MetaTrader account credentials
   */
  createMT5LiveAccount(account, profileId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createMT5LiveAccount');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${profileId || 'default'}/mt5-live-accounts`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: account
    };
    return this._httpClient.request(opts, 'createMT5LiveAccount');
  }

}
