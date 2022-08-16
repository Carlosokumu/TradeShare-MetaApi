import HttpClient from "./httpClient";

/**
 * Connection URL managing client
 */
export default class DomainClient {

  /**
   * Constructs domain client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {string} token authorization token
   * @param {string} domain domain to connect to, default is agiliumtrade.agiliumtrade.ai
   */
  constructor(httpClient: HttpClient, token: string, domain: string);

  /**
   * Returns domain client domain
   * @returns {string} client domain
   */
  get domain(): string;

  /**
   * Returns domain client token
   * @returns {string} client token
   */
  get token(): string;

  /**
   * Returns the API URL
   * @param {String} host REST API host
   * @param {String} region host region
   * @returns {String} API URL
   */
  getUrl(host: string, region: string): Promise<string>;

  /**
   * Returns domain settings
   * @returns {DomainSettings} domain settings
   */
  getSettings(): Promise<DomainSettings>;

}

/**
 * Domain settings
 */
export declare type DomainSettings = {

  /**
   * client api host name
   */
  hostname: string,

  /**
   * client api domain for regions
   */
  domain: string

}