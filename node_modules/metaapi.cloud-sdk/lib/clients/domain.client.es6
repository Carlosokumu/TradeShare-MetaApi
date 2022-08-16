'use strict';

import LoggerManager from '../logger';

/**
 * Connection URL managing client
 */
export default class DomainClient {

  /**
   * Constructs domain client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {String} token authorization token
   * @param {String} domain domain to connect to, default is agiliumtrade.agiliumtrade.ai
   */
  constructor(httpClient, token, domain = 'agiliumtrade.agiliumtrade.ai') {
    this._httpClient = httpClient;
    this._domain = domain;
    this._token = token;
    this._urlCache = {
      domain: null,
      hostname: null,
      requestPromise: null,
      lastUpdated: 0
    };
    this._retryIntervalInSeconds = 1;
    this._logger = LoggerManager.getLogger('DomainClient');
  }

  /**
   * Returns domain client domain
   * @returns {String} client domain
   */
  get domain() {
    return this._domain;
  }

  /**
   * Returns domain client token
   * @returns {String} client token
   */
  get token() {
    return this._token;
  }

  /**
   * Returns the API URL
   * @param {String} host REST API host
   * @param {String} region host region
   * @returns {String} API URL
   */
  async getUrl(host, region) {
    await this._updateDomain();
    return `${host}.${region}.${this._urlCache.domain}`;
  }

  /**
   * Domain settings
   * @typedef {Object} DomainSettings
   * @property {String} hostname client api host name
   * @property {String} domain client api domain for regions
   */

  /**
   * Returns domain settings
   * @returns {DomainSettings} domain settings
   */
  async getSettings() {
    await this._updateDomain();
    return {domain: this._urlCache.domain, hostname: this._urlCache.hostname};
  }

  async _updateDomain() {
    if(!this._urlCache.domain || this._urlCache.lastUpdated < Date.now() - 1000 * 60 * 10) {
      if(this._urlCache.requestPromise) {
        await this._urlCache.requestPromise;
      } else {
        let resolve, reject;
        this._urlCache.requestPromise = new Promise((res, rej) => {
          resolve = res, reject = rej;
        });
        let isCacheUpdated = false;
        while(!isCacheUpdated) {
          const opts = {
            url: `https://mt-provisioning-api-v1.${this._domain}/users/current/servers/mt-client-api`,
            method: 'GET',
            headers: {
              'auth-token': this._token
            },
            json: true,
          };
  
          try {
            const urlSettings = await this._httpClient.request(opts, '_updateDomain');
            this._urlCache = {
              domain: urlSettings.domain,
              hostname: urlSettings.hostname,
              requestPromise: null,
              lastUpdated: Date.now()
            }; 
            resolve();
            isCacheUpdated = true;
            this._retryIntervalInSeconds = 1;
          } catch (err) {
            this._logger.error('Failed to update domain settings cache', err);
            this._retryIntervalInSeconds = Math.min(this._retryIntervalInSeconds * 2, 300);
            await new Promise(res => setTimeout(res, this._retryIntervalInSeconds * 1000));
          }
        }
      }
    }
  }

}