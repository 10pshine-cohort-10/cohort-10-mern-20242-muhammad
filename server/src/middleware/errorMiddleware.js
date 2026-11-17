'use strict';

const logger = require('../config/logger');

/**
 * Global Express error handler (4-argument middleware).
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  // Operational / known errors
  if (err.isOperational) {
    logger.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
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
