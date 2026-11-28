'use strict';

const logger = require('../config/logger');

/**
 * @typedef {Error & {
 *   statusCode?: number,
 *   code?: string,
 *   isOperational?: boolean,
 *   name?: string
 * }} AppErrorShape
 */

/**
 * Global Express error handler (4-argument middleware).
 * @param {AppErrorShape} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {import('express').Response}
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // Operational / known errors (including client validation errors with statusCode < 500)
  if (err.isOperational || (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500)) {
    const statusCode = err.statusCode || 400;
    const code = err.code || 'VALIDATION_ERROR';
    logger.warn({ code, statusCode }, err.message);
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      code,
    });
  }

  // JWT errors that escaped the authMiddleware catch
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn({ code: 'AUTH_ERROR', statusCode: 401 }, 'Invalid or expired token');
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'AUTH_ERROR',
    });
  }

  // MySQL duplicate-entry constraint violation
  if (err.code === 'ER_DUP_ENTRY') {
    logger.warn({ code: 'DUPLICATE_ENTRY', statusCode: 409 }, 'Email or username already exists');
    return res.status(409).json({
      success: false,
      message: 'Email or username already exists',
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Catch-all for unexpected / non-operational errors (never leak stack trace in response)
  logger.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    code: 'SERVER_ERROR',
  });
}

module.exports = errorMiddleware;
