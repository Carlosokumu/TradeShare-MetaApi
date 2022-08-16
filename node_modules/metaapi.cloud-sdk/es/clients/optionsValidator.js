'use strict';

import {ValidationError} from './errorHandler';

/**
 * Class for validating API options.
 */
export default class OptionsValidator {

  /**
   * Validates a number parameter
   * @param {Number} value value to validate
   * @param {Number} defaultValue default value for an option
   * @param {String} name option name
   * @returns {Number} validated value
   * @throws {ValidationError} if value is invalid
   */
  validateNumber(value, defaultValue, name) {
    if(value === undefined) {
      return defaultValue;
    }
    if(typeof value !== 'number') {
      throw new ValidationError(`Parameter ${name} must be a number`);
    }
    if(value < 0) {
      throw new ValidationError(`Parameter ${name} cannot be lower than 0`);
    }
    return value;
  }
  
  /**
   * Validates a number parameter to be above zero
   * @param {Number} value value to validate
   * @param {Number} defaultValue default value for an option
   * @param {String} name option name
   * @returns {Number} validated value
   * @throws {ValidationError} if value is invalid
   */
  validateNonZero(value, defaultValue, name) {
    value = this.validateNumber(value, defaultValue, name);
  
    if(value === 0) {
      throw new ValidationError(`Parameter ${name} must be bigger than 0`);
    }
    return value;
  }
  
  /**
   * Validates a parameter to be boolean
   * @param {Boolean} value value to validate
   * @param {Boolean} defaultValue default value for an option
   * @param {String} name option name
   * @returns {Boolean} validated value
   * @throws {ValidationError} if value is invalid
   */
  validateBoolean(value, defaultValue, name) {
    if(value === undefined) {
      return defaultValue;
    }
  
    if(typeof value !== 'boolean') {
      throw new ValidationError(`Parameter ${name} must be a boolean`);
    }
    return value;
  }
}
