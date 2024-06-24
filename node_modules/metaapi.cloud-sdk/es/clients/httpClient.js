'use strict';

import request from 'request-promise-any';
import {
  UnauthorizedError, ForbiddenError, ApiError, ValidationError, InternalError, 
  NotFoundError, TooManyRequestsError, ConflictError
} from './errorHandler';
import OptionsValidator from './optionsValidator';
import TimeoutError from './timeoutError';
import LoggerManager from '../logger';

/**
 * HTTP client library based on request-promise
 */
export default class HttpClient {

  /**
   * @typedef {Object} RetryOptions retry options
   * @property {Number} [retries] the number of attempts to retry failed request, default 5
   * @property {Number} [minDelayInSeconds] minimum delay in seconds before retrying, default 1
   * @property {Number} [maxDelayInSeconds] maximum delay in seconds before retrying, default 30
   * @property {Number} [subscribeCooldownInSeconds] time to disable new subscriptions for
   */

  /**
   * Constructs HttpClient class instance
   * @param {Number} timeout request timeout in seconds
   * @param {RetryOptions} [retryOpts] retry options
   */
  constructor(timeout = 60, retryOpts = {}) {
    const validator = new OptionsValidator();
    this._timeout = timeout * 1000;
    this._retries = validator.validateNumber(retryOpts.retries, 5, 'retryOpts.retries');
    this._minRetryDelay = validator.validateNonZero(retryOpts.minDelayInSeconds, 1,
      'retryOpts.minDelayInSeconds') * 1000;
    this._maxRetryDelay = validator.validateNonZero(retryOpts.maxDelayInSeconds, 30,
      'retryOpts.maxDelayInSeconds') * 1000;
    this._logger = LoggerManager.getLogger('HttpClient');
  }

  /**
   * Performs a request. Response errors are returned as ApiError or subclasses.
   * @param {Object} options request options
   * @returns {Object|String|any} request result
   */
  async request(options, type = '', retryCounter = 0, endTime = Date.now() + this._maxRetryDelay * this._retries) {
    options.timeout = this._timeout;
    let retryAfterSeconds = 0;
    options.callback = (e, res) => {
      if (res && res.statusCode === 202) {
        retryAfterSeconds = res.headers['retry-after'];
        if(isNaN(retryAfterSeconds)) {
          retryAfterSeconds = Math.max((new Date(retryAfterSeconds).getTime() - Date.now()) / 1000, 1);
        }
      }
    };
    let body;
    try {
      body = await this._makeRequest(options);
    } catch (err) {
      retryCounter = await this._handleError(err, type, retryCounter, endTime);
      return this.request(options, type, retryCounter, endTime);
    }
    if (retryAfterSeconds) {
      if(body && body.message) {
        this._logger.info(`Retrying request in ${Math.floor(retryAfterSeconds)} seconds because request ` +
          'returned message:', body.message);
      }
      await this._handleRetry(endTime, retryAfterSeconds * 1000);
      body = await this.request(options, type, retryCounter, endTime);
    }
    return body;
  }

  _makeRequest(options) {
    return request(options);
  }

  async _wait(pause) {
    await new Promise(res => setTimeout(res, pause));
  }

  async _handleRetry(endTime, retryAfter) {
    if(endTime > Date.now() + retryAfter) {
      await this._wait(retryAfter);
    } else {
      throw new TimeoutError('Timed out waiting for the response');
    }
  }

  async _handleError(err, type, retryCounter, endTime) {
    const error = this._convertError(err);
    if(['ConflictError', 'InternalError', 'ApiError', 'TimeoutError'].includes(error.name) 
      && retryCounter < this._retries) {
      const pause = Math.min(Math.pow(2, retryCounter) * this._minRetryDelay, this._maxRetryDelay);
      await this._wait(pause);
      return retryCounter + 1;
    } else if(error.name === 'TooManyRequestsError') {
      const retryTime = Date.parse(error.metadata.recommendedRetryTime);
      if (retryTime < endTime) {
        this._logger.debug(`${type} request has failed with TooManyRequestsError (HTTP status code 429). ` +
          `Will retry request in ${Math.ceil((retryTime - Date.now()) / 1000)} seconds`);
        await this._wait(retryTime - Date.now());
        return retryCounter;
      }
    }
    throw error;
  }

  // eslint-disable-next-line complexity
  _convertError(err) {
    err.error = err.error || {};
    let status = err.statusCode || err.status;
    switch (status) {
    case 400:
      return new ValidationError(err.error.message || err.message, err.error.details || err.details);
    case 401:
      return new UnauthorizedError(err.error.message || err.message);
    case 403:
      return new ForbiddenError(err.error.message || err.message);
    case 404:
      return new NotFoundError(err.error.message || err.message);
    case 409:
      return new ConflictError(err.error.message || err.message);
    case 429:
      return new TooManyRequestsError(err.error.message || err.message, err.error.metadata || err.metadata);
    case 500:
      return new InternalError(err.error.message || err.message);
    default:
      return new ApiError(ApiError, err.error.message || err.message, status);
    }
  }

}

/**
 * HTTP client service mock for tests
 */
export class HttpClientMock extends HttpClient {

  /**
   * Constructs HTTP client mock
   * @param {Function(options:Object):Promise} requestFn mocked request function
   * @param {Number} timeout request timeout in seconds
   * @param {RetryOptions} retryOpts retry options
   */
  constructor(requestFn, timeout, retryOpts) {
    super(timeout, retryOpts);
    this._requestFn = requestFn;
  }

  _makeRequest() {
    return this._requestFn.apply(this, arguments);
  }

}
