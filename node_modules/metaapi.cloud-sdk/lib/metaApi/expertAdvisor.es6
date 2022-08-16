'use strict';

/**
 * Implements an expert advisor entity
 */
export default class ExpertAdvisor {

  /**
   * Constructs an expert advisor entity
   * @param {ExpertAdvisorDto} data
   * @param accountId
   * @param expertAdvisorClient
   */
  constructor(data, accountId, expertAdvisorClient) {
    this._data = data;
    this._accountId = accountId;
    this._expertAdvisorClient = expertAdvisorClient;
  }

  /**
   * Returns expert id
   * @returns {String} expert id
   */
  get expertId() {
    return this._data.expertId;
  }

  /**
   * Returns expert period
   * @returns {String} expert period
   */
  get period() {
    return this._data.period;
  }

  /**
   * Returns expert symbol
   * @returns {String} expert symbol
   */
  get symbol() {
    return this._data.symbol;
  }

  /**
   * Returns true if expert file was uploaded
   * @returns {Boolean}
   */
  get fileUploaded() {
    return this._data.fileUploaded;
  }

  /**
   * Reloads expert advisor from API
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisor/)
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  async reload() {
    this._data = await this._expertAdvisorClient.getExpertAdvisor(this._accountId, this.expertId);
  }

  /**
   * Updates expert advisor data
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/updateExpertAdvisor/)
   * @param {NewExpertAdvisorDto} expert new expert advisor data
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  async update(expert) {
    await this._expertAdvisorClient.updateExpertAdvisor(this._accountId, this.expertId, expert);
    await this.reload();
  }

  /**
   * Uploads an expert advisor file. EAs which use DLLs are not supported
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/uploadEAFile/)
   * @param {String|Buffer} file expert advisor file
   * @returns {Promise} promise resolving when file upload is completed
   */
  async uploadFile(file) {
    await this._expertAdvisorClient.uploadExpertAdvisorFile(this._accountId, this.expertId, file);
    await this.reload();
  }

  /**
   * Removes expert advisor
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/deleteExpertAdvisor/)
   * @returns {Promise} promise resolving when expert advisor removed
   */
  async remove() {
    await this._expertAdvisorClient.deleteExpertAdvisor(this._accountId, this.expertId);
  }

}
