import { MetatraderAccountCredentialsDto } from "../clients/metaApi/metatraderAccountGenerator.client";

/**
 * Implements a MetaTrader account credentials entity
 */
export default class MetatraderAccountCredentials {
  
  /**
   * Constructs a MetaTrader account credentials entity
   * @param {MetatraderAccountCredentialsDto} data MetaTrader account credentials data
   */
  constructor(data: MetatraderAccountCredentialsDto);
  
  /**
   * Returns account login
   * @return {string} account login
   */
  get login(): string;
  
  /**
   * Returns account password
   * @return {string} account password
   */
  get password(): string;
  
  /**
   * Returns account serverName
   * @return {string} account serverName
   */
  get serverName(): string;
  
  /**
   * Returns account investor password
   * @return {string} account investor password
   */
  get investorPassword(): string
}