import ExpertAdvisorClient, { ExpertAdvisorDto, NewExpertAdvisorDto } from "../clients/metaApi/expertAdvisor.client";

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
  constructor(data: ExpertAdvisorDto, accountId: string, expertAdvisorClient: ExpertAdvisorClient);
  
  /**
   * Returns expert id
   * @returns {string} expert id
   */
  get expertId(): string;
  
  /**
   * Returns expert period
   * @returns {string} expert period
   */
  get period(): string;
  
  /**
   * Returns expert symbol
   * @returns {string} expert symbol
   */
  get symbol(): string;
  
  /**
   * Returns true if expert file was uploaded
   * @returns {boolean}
   */
  get fileUploaded(): boolean;
  
  /**
   * Reloads expert advisor from API
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisor/)
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  reload(): Promise<any>;
  
  /**
   * Updates expert advisor data
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/updateExpertAdvisor/)
   * @param {NewExpertAdvisorDto} expert new expert advisor data
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  update(expert: NewExpertAdvisorDto): Promise<any>;
  
  /**
   * Uploads an expert advisor file. EAs which use DLLs are not supported
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/uploadEAFile/)
   * @param {string|Buffer} file expert advisor file
   * @returns {Promise} promise resolving when file upload is completed
   */
  uploadFile(file: string|Buffer): Promise<any>;
  
  /**
   * Removes expert advisor
   * (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/deleteExpertAdvisor/)
   * @returns {Promise} promise resolving when expert advisor removed
   */
  remove(): Promise<any>;
}