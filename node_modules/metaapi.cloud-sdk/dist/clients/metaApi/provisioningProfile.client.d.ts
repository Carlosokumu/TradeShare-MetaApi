/**
 * metaapi.cloud provisioning profile API client (see https://metaapi.cloud/docs/provisioning/)
 */
export class ProvisioningProfileClient {

  /**
   * Retrieves provisioning profiles owned by user
   * (see https://metaapi.cloud/docs/provisioning/api/provisioningProfile/readProvisioningProfiles/)
   * Method is accessible only with API access token
   * @param {number} version optional version filter (allowed values are 4 and 5)
   * @param {string} status optional status filter (allowed values are new and active)
   * @return {Promise<Array<ProvisioningProfileDto>>} promise resolving with provisioning profiles found
   */
   getProvisioningProfiles(version: number, status: string): Promise<Array<ProvisioningProfileDto>>;

   /**
   * Retrieves a provisioning profile by id (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/readProvisioningProfile/). Throws an error if
   * profile is not found.
   * Method is accessible only with API access token
   * @param {string} id provisioning profile id
   * @return {Promise<ProvisioningProfileDto>} promise resolving with provisioning profile found
   */
  getProvisioningProfile(id: string): Promise<ProvisioningProfileDto>

  /**
   * Creates a new provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/createNewProvisioningProfile/). After creating a
   * provisioning profile you are required to upload extra files in order to activate the profile for further use.
   * Method is accessible only with API access token
   * @param {NewProvisioningProfileDto} provisioningProfile provisioning profile to create
   * @return {Promise<ProvisioningProfileIdDto>} promise resolving with an id of the provisioning profile created
   */
  createProvisioningProfile(provisioningProfile: NewProvisioningProfileDto): Promise<ProvisioningProfileIdDto>;
   
   /**
   * Uploads a file to a provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/uploadFilesToProvisioningProfile/). Uploading a
   * file by name is allowed only for Node.js.
   * Method is accessible only with API access token
   * @param {string} provisioningProfileId provisioning profile id to upload file to
   * @param {string} fileName name of the file to upload. Allowed values are servers.dat for MT5 profile, broker.srv for
   * MT4 profile
   * @param {string|Buffer} file path to a file to upload or buffer containing file contents
   * @return {Promise} promise resolving when file upload is completed
   */
  uploadProvisioningProfileFile(provisioningProfileId: string, fileName: string, file: string|Buffer): Promise<any>;

  /**
   * Deletes a provisioning profile (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/deleteProvisioningProfile/). Please note that in
   * order to delete a provisioning profile you need to delete MT accounts connected to it first.
   * Method is accessible only with API access token
   * @param {string} id provisioning profile id
   * @return {Promise} promise resolving when provisioning profile is deleted
   */
  deleteProvisioningProfile(id: string): Promise<any>;

  /**
   * Updates existing provisioning profile data (see
   * https://metaapi.cloud/docs/provisioning/api/provisioningProfile/updateProvisioningProfile/).
   * Method is accessible only with API access token
   * @param {string} id provisioning profile id
   * @param {ProvisioningProfileUpdateDto} provisioningProfile updated provisioning profile
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  updateProvisioningProfile(id: string, provisioningProfile: ProvisioningProfileUpdateDto): Promise<any>;
}

/**
 * Provisioning profile model
 */
export declare type ProvisioningProfileDto = {

  /**
   * provisioning profile unique identifier
   */
  _id: string,

  /**
   * provisioning profile name
   */
  name: string,

  /**
   * MetaTrader version (allowed values are 4 and 5)
   */
  version: number,

  /**
   * provisioning profile status (allowed values are new and active)
   */
  status: string,

  /**
   * broker timezone name from Time Zone Database
   */
  brokerTimezone: string,

  /**
   * broker DST switch timezone name from Time Zone Database
   */
  brokerDSTSwitchTimezone: string
}

/**
 * New provisioning profile model
 */
export declare type NewProvisioningProfileDto = {

  /**
   * provisioning profile name
   */
  name: string,

  /**
   * MetaTrader version (allowed values are 4 and 5)
   */
  version: number,

  /**
   * broker timezone name from Time Zone Database
   */
  brokerTimezone: string,

  /**
   * broker DST switch timezone name from Time Zone Database
   */
  brokerDSTSwitchTimezone: string
}

/**
 * Updated provisioning profile data
 */
export declare type ProvisioningProfileUpdateDto = {

  /**
   * provisioning profile name
   */
  name: string
}

/**
 * Provisioning profile id model
 */
export declare type ProvisioningProfileIdDto = {

  /**
   * provisioning profile unique identifier
   */
  id: string
}