'use strict';

/**
 * Custom application operational error class.
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [code='APP_ERROR']
   * @param {boolean} [isOperational=true]
   */
  constructor(message, statusCode, code = 'APP_ERROR', isOperational = true) {
    super(message);
    /** @type {number} */
    this.statusCode = statusCode;
    /** @type {string} */
    this.code = code;
    /** @type {boolean} */
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
