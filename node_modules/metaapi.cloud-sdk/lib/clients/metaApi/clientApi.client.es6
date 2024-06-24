'use strict';

import MetaApiClient from '../metaApi.client';
import LoggerManager from '../../logger';

/**
 * metaapi.cloud client API client (see https://metaapi.cloud/docs/client/)
 */
export default class ClientApiClient extends MetaApiClient {

  /**
   * Constructs client API client instance
   * @param {HttpClient} httpClient HTTP client
   * @param {DomainClient} domainClient domain client
   */
  constructor(httpClient, domainClient) {
    super(httpClient, domainClient);
    this._host = 'https://mt-client-api-v1';
    this._retryIntervalInSeconds = 1;
    this._ignoredFieldListsCache = {
      lastUpdated: 0,
      data: null,
      requestPromise: null
    };
    this._logger = LoggerManager.getLogger('ClientApiClient');
  }

  /**
   * Type hashing ignored field lists
   * @typedef {Object} TypeHashingIgnoredFieldLists
   * @property {String[]} specification specification ignored fields
   * @property {String[]} position position ignored fields
   * @property {String[]} order order ignored fields
   */

  /**
   * Hashing ignored field lists
   * @typedef {Object} HashingIgnoredFieldLists
   * @property {TypeHashingIgnoredFieldLists} g1 g1 hashing ignored field lists
   * @property {TypeHashingIgnoredFieldLists} g2 g2 hashing ignored field lists
   */

  /**
   * Retrieves hashing ignored field lists
   * @param {String} region account region
   * @returns {Promise<HashingIgnoredFieldLists>} promise resolving with hashing ignored field lists
   */
  async getHashingIgnoredFieldLists(region) {
    if(!this._ignoredFieldListsCache.data || Date.now() - this._ignoredFieldListsCache.lastUpdated > 60 * 60 * 1000) {
      if(this._ignoredFieldListsCache.requestPromise) {
        await this._ignoredFieldListsCache.requestPromise;
      } else{
        let resolve, reject;
        this._ignoredFieldListsCache.requestPromise = new Promise((res, rej) => {
          resolve = res, reject = rej;
        });
        let isCacheUpdated = false;
        while(!isCacheUpdated) {
          try {
            const host = await this._domainClient.getUrl(this._host, region);
            const opts = {
              url: `${host}/hashing-ignored-field-lists`,
              method: 'GET',
              json: true,
              headers: {
                'auth-token': this._token
              }
            };
            const response = await this._httpClient.request(opts, 'getHashingIgnoredFieldLists');
            this._ignoredFieldListsCache = { lastUpdated: Date.now(), data: response, requestPromise: null };
            resolve(response);
            isCacheUpdated = true;
            this._retryIntervalInSeconds = 1;
          } catch (err) {
            this._logger.error('Failed to update hashing ignored field list', err);
            this._retryIntervalInSeconds = Math.min(this._retryIntervalInSeconds * 2, 300);
            await new Promise(res => setTimeout(res, this._retryIntervalInSeconds * 1000));
          }
        }
      }
    }
    return this._ignoredFieldListsCache.data;
  }
}
