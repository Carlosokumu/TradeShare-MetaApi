'use strict';

/**
 * Error which indicates that a trade have failed
 */
export default class TradeError extends Error {

  /**
   * Constructs the error
   * @param {String} message error message
   * @param {Number} numericCode numeric error code
   * @param {String} stringCode string error code
   */
  constructor(message, numericCode, stringCode) {
    super(message);
    this.name = 'TradeError';
    this.numericCode = numericCode;
    this.stringCode = stringCode;
  }

}
