'use strict';

import MetaApiClient from '../metaApi.client';
import fs from 'fs';

/**
 * metaapi.cloud expert advisor API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class ExpertAdvisorClient extends MetaApiClient {

  /**
   * Expert advisor model
   * @typedef {Object} ExpertAdvisorDto
   * @property {String} expertId expert advisor id
   * @property {String} period expert advisor period
   * @property {String} symbol expert advisor symbol
   * @property {Boolean} fileUploaded true if expert file was uploaded
   */

  /**
   * Retrieves expert advisors by account id (see
   * https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisors/)
   * Method is accessible only with API access token
   * @param {String} accountId Metatrader account id
   * @returns {Promise<ExpertAdvisorDto[]>} promise resolving with expert advisors found
   */
  getExpertAdvisors(accountId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getExpertAdvisors');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/expert-advisors`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getExpertAdvisors');
  }

  /**
   * Retrieves an expert advisor by id (see
   * https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisor/).
   * Thrown an error if expert is not found. Method is accessible only with API access token
   * @param {String} accountId Metatrader account id
   * @param {String} expertId expert advisor id
   * @returns {Promise<ExpertAdvisorDto>} promise resolving with expert advisor found
   */
  getExpertAdvisor(accountId, expertId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getExpertAdvisor');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/expert-advisors/${expertId}`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getExpertAdvisor');
  }

  /**
   * Updated expert advisor data
   * @typedef {Object} NewExpertAdvisorDto
   * @property {String} period expert advisor symbol.
   * For MetaTrader 4 allowed periods are 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1mn
   * For MetaTrader 5 allowed periods are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h,
   * 1d, 1w, 1mn
   * @property {String} symbol expert advisor period
   * @property {String} preset base64-encoded preset file
   */

  /**
   * Updates or creates expert advisor data (see
   * https://metaapi.cloud/docs/provisioning/api/expertAdvisor/updateExpertAdvisor/).
   * Method is accessible only with API access token
   * @param {String} accountId Metatrader account id
   * @param {String} expertId expert id
   * @param {NewExpertAdvisorDto} expert new expert advisor data
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  updateExpertAdvisor(accountId, expertId, expert) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('updateExpertAdvisor');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/expert-advisors/${expertId}`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: expert
    };
    return this._httpClient.request(opts, 'updateExpertAdvisor');
  }

  /**
   * Uploads an expert advisor file (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/uploadEAFile/)
   * Method is accessible only with API access token
   * @param {String} accountId Metatrader account id
   * @param {String} expertId expert id
   * @param {String|Buffer} file path to a file to upload or buffer containing file contents
   * @returns {Promise} promise resolving when file upload is completed
   */
  uploadExpertAdvisorFile(accountId, expertId, file) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('uploadExpertAdvisorFile');
    }
    if (typeof file === 'string') {
      file = fs.createReadStream(file);
    }
    const opts = {
      method: 'PUT',
      url: `${this._host}/users/current/accounts/${accountId}/expert-advisors/${expertId}/file`,
      formData: {
        file
      },
      json: true,
      headers: {
        'auth-token': this._token
      }
    };
    return this._httpClient.request(opts, 'uploadExpertAdvisorFile');
  }

  /**
   * Deletes an expert advisor (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/deleteExpertAdvisor/)
   * Method is accessible only with API access token
   * @param {String} accountId Metatrader account id
   * @param {String} expertId expert id
   * @returns {Promise} promise resolving when expert advisor is deleted
   */
  deleteExpertAdvisor(accountId, expertId) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deleteExpertAdvisor');
    }
    const opts = {
      url: `${this._host}/users/current/accounts/${accountId}/expert-advisors/${expertId}`,
      method: 'DELETE',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deleteExpertAdvisor');
  }

}
