import HttpClient from "./httpClient";
import DomainClient from "./domain.client";

/**
 * metaapi.cloud MetaTrader API client
 */
export default class MetaApiClient {
  
  /**
   * Constructs MetaTrader API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {DomainClient} domainClient domain client
   */
  constructor(httpClient: HttpClient, domainClient: DomainClient);  
}