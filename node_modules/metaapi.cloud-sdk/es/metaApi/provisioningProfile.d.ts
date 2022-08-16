import { ProvisioningProfileClient, ProvisioningProfileDto, ProvisioningProfileUpdateDto } from "../clients/metaApi/provisioningProfile.client";

/**
 * Implements a provisioning profile entity
 */
export default class ProvisioningProfile {

  /**
   * Constructs a provisioning profile entity
   * @param {ProvisioningProfileDto} data provisioning profile data
   * @param {ProvisioningProfileClient} provisioningProfileClient provisioning profile REST API client
   */
  constructor(data: ProvisioningProfileDto, provisioningProfileClient: ProvisioningProfileClient);
  
  /**
   * Returns profile id
   * @return {string} profile id
   */
  get id(): string;

  /**
   * Returns profile name
   * @return {string} profile name
   */
  get name(): string;

  /**
   * Returns profile version. Possible values are 4 and 5
   * @return {number} profile version
   */
  get version(): number;

  /**
   * Returns profile status. Possible values are new and active
   * @return {string} profile status
   */
  get status(): string;

  /**
   * Returns broker timezone name from Time Zone Database
   * @return {string} broker timezone name
   */
  get brokerTimezone(): string;

  /**
   * Returns broker DST timezone name from Time Zone Database
   * @return {string} broker DST switch timezone name
   */
  get brokerDSTSwitchTimezone(): string;

  /**
   * Reloads provisioning profile from API
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  reload(): Promise<any>;

  /**
   * Removes provisioning profile. The current object instance should be discarded after returned promise resolves.
   * @return {Promise} promise resolving when provisioning profile is removed
   */
  remove(): Promise<any>;

  /**
   * Uploads a file to provisioning profile.
   * @param {string} fileName name of the file to upload. Allowed values are servers.dat for MT5 profile, broker.srv for
   * MT4 profile
   * @param {string|Buffer} file path to a file to upload or buffer containing file contents
   * @return {Promise} promise which resolves when the file was uploaded
   */
  uploadFile(fileName: string, file: string|Buffer): Promise<any>;

  /**
   * Updates provisioning profile
   * @param {ProvisioningProfileUpdateDto} profile provisioning profile update
   * @return {Promise} promise resolving when provisioning profile is updated
   */
  update(profile: ProvisioningProfileUpdateDto): Promise<any>;
}