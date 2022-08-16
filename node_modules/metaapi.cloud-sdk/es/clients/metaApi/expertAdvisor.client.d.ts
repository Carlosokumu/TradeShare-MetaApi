import MetaApiClient from "../metaApi.client"

/**
 * metaapi.cloud expert advisor API client (see https://metaapi.cloud/docs/provisioning/)
 */
export default class ExpertAdvisorClient extends MetaApiClient {

  /**
   * Retrieves expert advisors by account id (see
   * https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisors/)
   * Method is accessible only with API access token
   * @param {string} accountId Metatrader account id
   * @returns {Promise<ExpertAdvisorDto[]>} promise resolving with expert advisors found
   */
  getExpertAdvisors(accountId: string): Promise<ExpertAdvisorDto[]>;

  /**
   * Retrieves an expert advisor by id (see
   * https://metaapi.cloud/docs/provisioning/api/expertAdvisor/readExpertAdvisor/).
   * Thrown an error if expert is not found. Method is accessible only with API access token
   * @param {string} accountId Metatrader account id
   * @param {string} expertId expert advisor id
   * @returns {Promise<ExpertAdvisorDto>} promise resolving with expert advisor found
   */
  getExpertAdvisor(accountId: string, expertId: string): Promise<ExpertAdvisorDto>;
  
  /**
   * Updates or creates expert advisor data (see
   * https://metaapi.cloud/docs/provisioning/api/expertAdvisor/updateExpertAdvisor/).
   * Method is accessible only with API access token
   * @param {string} accountId Metatrader account id
   * @param {string} expertId expert id
   * @param {NewExpertAdvisorDto} expert new expert advisor data
   * @returns {Promise} promise resolving when expert advisor is updated
   */
  updateExpertAdvisor(accountId: string, expertId: string, expert: NewExpertAdvisorDto): Promise<any>;
  
  /**
   * Uploads an expert advisor file (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/uploadEAFile/)
   * Method is accessible only with API access token
   * @param {string} accountId Metatrader account id
   * @param {string} expertId expert id
   * @param {string|Buffer} file path to a file to upload or buffer containing file contents
   * @returns {Promise} promise resolving when file upload is completed
   */
  uploadExpertAdvisorFile(accountId: string, expertId: string, file: string | Buffer): Promise<any>;
  
  /**
   * Deletes an expert advisor (see https://metaapi.cloud/docs/provisioning/api/expertAdvisor/deleteExpertAdvisor/)
   * Method is accessible only with API access token
   * @param {string} accountId Metatrader account id
   * @param {string} expertId expert id
   * @returns {Promise} promise resolving when expert advisor is deleted
   */
  deleteExpertAdvisor(accountId: string, expertId: string): Promise<any>;
}

/**
 * Expert advisor model
 */
export declare type ExpertAdvisorDto = {

  /**
   * expert advisor id
   */
  expertId: string,

  /**
   * expert advisor period
   */
  period: string,

  /**
   * expert advisor symbol
   */
  symbol: string,

  /**
   * true if expert file was uploaded
   */
  fileUploaded: string
}

/**
 * Updated expert advisor data
 */
export declare type NewExpertAdvisorDto = {

  /**
   * expert advisor symbol.
   * For MetaTrader 4 allowed periods are 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w, 1mn
   * For MetaTrader 5 allowed periods are 1m, 2m, 3m, 4m, 5m, 6m, 10m, 12m, 15m, 20m, 30m, 1h, 2h, 3h, 4h, 6h, 8h, 12h,
   * 1d, 1w, 1mn
   */
  period: string,

  /**
   * expert advisor period
   */
  symbol: string,

  /**
   * base64-encoded preset file
   */
  preset: string
}