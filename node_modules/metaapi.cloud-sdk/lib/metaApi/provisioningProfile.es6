'use strict';

/**
 * Implements a provisioning profile entity
 */
export default class ProvisioningProfile {

  /**
   * Constructs a provisioning profile entity
   * @param {ProvisioningProfileDto} data provisioning profile data
   * @param {ProvisioningProfileClient} provisioningProfileClient provisioning profile REST API client
   */
  constructor(data, provisioningProfileClient) {
    this._data = data;
    this._provisioningProfileClient = provisioningProfileClient;
  }

  /**
   * Returns profile id
   * @return {String} profile id
   */
  get id() {
    return this._data._id;
  }

  /**
   * Returns profile name
   * @return {String} profile name
   */
  get name() {
    return this._data.name;
  }

  /**
   * Returns profile version. Possible values are 4 and 5
   * @return {Number} profile version
   */
  get version() {
    return this._data.version;
  }

  /**
   * Returns profile status. Possible values are new and active
   * @return {String} profile status
   */
  get status() {
    return this._data.status;
  }

  /**
   * Returns broker timezone name from Time Zone Database
   * @return {String} broker timezone name
   */
  get brokerTimezone() {
    return this._data.brokerTimezone;
  }

  /**
   * Returns broker DST timezone name from Time Zone Database
   * @return {String} broker DST switch timezone name
   */
  get brokerDSTSwitchTimezone() {
    return this._data.brokerDSTSwitchTimezone;
  }

  /**
   * Reloads provisioning profile from API
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  async reload() {
    this._data = await this._provisioningProfileClient.getProvisioningProfile(this.id);
  }

  /**
   * Removes provisioning profile. The current object instance should be discarded after returned promise resolves.
   * @return {Promise} promise resolving when provisioning profile is removed
   */
  remove() {
    return this._provisioningProfileClient.deleteProvisioningProfile(this.id);
  }

  /**
   * Uploads a file to provisioning profile.
   * @param {String} fileName name of the file to upload. Allowed values are servers.dat for MT5 profile, broker.srv for
   * MT4 profile
   * @param {String|Buffer} file path to a file to upload or buffer containing file contents
   * @return {Promise} promise which resolves when the file was uploaded
   */
  uploadFile(fileName, file) {
    return this._provisioningProfileClient.uploadProvisioningProfileFile(this.id, fileName, file);
  }

  /**
   * Updates provisioning profile
   * @param {ProvisioningProfileUpdateDto} profile provisioning profile update
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  async update(profile) {
    await this._provisioningProfileClient.updateProvisioningProfile(this.id, profile);
    await this.reload();
  }

}
