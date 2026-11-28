'use strict';

require('dotenv').config();
const logger = require('./src/config/logger');

// Validate required environment variables at startup — before loading the app
if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET is missing or empty. Set it before starting the server.');
  process.exit(1);
}

/**
 * Handle uncaught exceptions gracefully.
 * @param {Error} err
 * @returns {void}
 */
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception — shutting down');
  process.exit(1);
});

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

/** @type {import('http').Server} */
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
});

/**
 * Graceful shutdown on SIGTERM signal.
 * @returns {void}
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  const timer = setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 5000);
  timer.unref();

  server.close(() => {
    clearTimeout(timer);
    logger.info('Server closed');
    process.exit(0);
  });
});

/**
 * Handle unhandled promise rejections gracefully.
 * @param {unknown} reason
 * @param {Promise<unknown>} promise
 * @returns {void}
 */
process.on('unhandledRejection', (reason, promise) => {
  const errorObj = reason instanceof Error ? reason : new Error(String(reason));
  logger.error({ err: errorObj, promise }, 'Unhandled Rejection — shutting down');
  const timer = setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 5000);
  timer.unref();

  server.close(() => {
    clearTimeout(timer);
    process.exit(1);
  });
});
