'use strict';

import fs from 'fs';

import MetaApiClient from '../metaApi.client';

/**
 * metaapi.cloud provisioning profile API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class ProvisioningProfileClient extends MetaApiClient {

  /**
   * Provisioning profile model
   * @typedef {Object} ProvisioningProfileDto
   * @property {String} _id provisioning profile unique identifier
   * @property {String} name provisioning profile name
   * @property {Number} version MetaTrader version (allowed values are 4 and 5)
   * @property {String} status provisioning profile status (allowed values are new and active)
   * @property {String} brokerTimezone broker timezone name from Time Zone Database
   * @property {String} brokerDSTSwitchTimezone broker DST switch timezone name from Time Zone Database
   */

  /**
   * Retrieves provisioning profiles owned by user
   * (see https://metaapi.cloud/docs/provisioning/api/provisioningProfile/readProvisioningProfiles/)
   * Method is accessible only with API access token
   * @param {Number} version optional version filter (allowed values are 4 and 5)
   * @param {String} status optional status filter (allowed values are new and active)
   * @return {Promise<Array<ProvisioningProfileDto>>} promise resolving with provisioning profiles found
   */
  getProvisioningProfiles(version, status) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getProvisioningProfiles');
    }
    let qs = {};
    if (version) {
      qs.version = version;
    }
    if (status) {
      qs.status = status;
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles`,
      method: 'GET',
      qs,
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getProvisioningProfiles');
  }

  /**
   * Retrieves a provisioning profile by id (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/readProvisioningProfile/). Throws an error if
   * profile is not found.
   * Method is accessible only with API access token
   * @param {String} id provisioning profile id
   * @return {Promise<ProvisioningProfileDto>} promise resolving with provisioning profile found
   */
  getProvisioningProfile(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('getProvisioningProfile');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${id}`,
      method: 'GET',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'getProvisioningProfile');
  }

  /**
   * New provisioning profile model
   * @typedef {Object} NewProvisioningProfileDto
   * @property {String} name provisioning profile name
   * @property {Number} version MetaTrader version (allowed values are 4 and 5)
   * @property {String} brokerTimezone broker timezone name from Time Zone Database
   * @property {String} brokerDSTSwitchTimezone broker DST switch timezone name from Time Zone Database
   */

  /**
   * Provisioning profile id model
   * @typedef {Object} ProvisioningProfileIdDto
   * @property {String} id provisioning profile unique identifier
   */

  /**
   * Creates a new provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/createNewProvisioningProfile/). After creating a
   * provisioning profile you are required to upload extra files in order to activate the profile for further use.
   * Method is accessible only with API access token
   * @param {NewProvisioningProfileDto} provisioningProfile provisioning profile to create
   * @return {Promise<ProvisioningProfileIdDto>} promise resolving with an id of the provisioning profile created
   */
  createProvisioningProfile(provisioningProfile) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('createProvisioningProfile');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles`,
      method: 'POST',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: provisioningProfile
    };
    return this._httpClient.request(opts, 'createProvisioningProfile');
  }

  /**
   * Uploads a file to a provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/uploadFilesToProvisioningProfile/). Uploading a
   * file by name is allowed only for Node.js.
   * Method is accessible only with API access token
   * @param {String} provisioningProfileId provisioning profile id to upload file to
   * @param {String} fileName name of the file to upload. Allowed values are servers.dat for MT5 profile, broker.srv for
   * MT4 profile
   * @param {String|Buffer} file path to a file to upload or buffer containing file contents
   * @return {Promise} promise resolving when file upload is completed
   */
  uploadProvisioningProfileFile(provisioningProfileId, fileName, file) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('uploadProvisioningProfileFile');
    }
    if (typeof file === 'string') {
      file = fs.createReadStream(file);
    } else {
      file = {
        value: file,
        options: {
          filename: 'serverFile'
        }
      };
    }
    const opts = {
      method: 'PUT',
      url: `${this._host}/users/current/provisioning-profiles/${provisioningProfileId}/${fileName}`,
      formData: {
        file
      },
      json: true,
      headers: {
        'auth-token': this._token
      }
    };
    return this._httpClient.request(opts, 'uploadProvisioningProfileFile');
  }

  /**
   * Deletes a provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/deleteProvisioningProfile/). Please note that in
   * order to delete a provisioning profile you need to delete MT accounts connected to it first.
   * Method is accessible only with API access token
   * @param {String} id provisioning profile id
   * @return {Promise} promise resolving when provisioning profile is deleted
   */
  deleteProvisioningProfile(id) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('deleteProvisioningProfile');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${id}`,
      method: 'DELETE',
      headers: {
        'auth-token': this._token
      },
      json: true
    };
    return this._httpClient.request(opts, 'deleteProvisioningProfile');
  }

  /**
   * Updated provisioning profile data
   * @typedef {Object} ProvisioningProfileUpdateDto
   * @property {String} name provisioning profile name
   */

  /**
   * Updates existing provisioning profile data (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/updateProvisioningProfile/).
   * Method is accessible only with API access token
   * @param {String} id provisioning profile id
   * @param {ProvisioningProfileUpdateDto} provisioningProfile updated provisioning profile
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  updateProvisioningProfile(id, provisioningProfile) {
    if (this._isNotJwtToken()) {
      return this._handleNoAccessError('updateProvisioningProfile');
    }
    const opts = {
      url: `${this._host}/users/current/provisioning-profiles/${id}`,
      method: 'PUT',
      headers: {
        'auth-token': this._token
      },
      json: true,
      body: provisioningProfile
    };
    return this._httpClient.request(opts, 'updateProvisioningProfile');
  }

}
