'use strict';

/**
 * Implements a MetaTrader account credentials entity
 */
export default class MetatraderAccountCredentials {

  /**
   * Constructs a MetaTrader account credentials entity
   * @param {MetatraderAccountCredentialsDto} data MetaTrader account credentials data
   */
  constructor(data) {
    this._data = data;
  }

  /**
   * Returns account login
   * @return {String} account login
   */
  get login() {
    return this._data.login;
  }

  /**
   * Returns account password
   * @return {String} account password
   */
  get password() {
    return this._data.password;
  }

  /**
   * Returns account serverName
   * @return {String} account serverName
   */
  get serverName() {
    return this._data.serverName;
  }

  /**
   * Returns account investor password
   * @return {String} account investor password
   */
  get investorPassword() {
    return this._data.investorPassword;
  }

}
