'use strict';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const logger = require('./config/logger');
const AppError = require('./utils/AppError');

/** @type {import('express').Express} */
const app = express();
app.disable('x-powered-by');

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(
  pinoHttp({
    logger,
    /**
     * Determine custom log level based on response status code or error.
     * @param {import('http').IncomingMessage} req
     * @param {import('http').ServerResponse} res
     * @param {Error} [err]
     * @returns {import('pino').LevelWithSilentOrString}
     */
    customLogLevel(req, res, err) {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notes API is healthy and operational',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/notesRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 handler
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
app.use((req, res, next) =>
  next(new AppError('Route not found', 404, 'NOT_FOUND'))
);

// Global error handler
app.use(require('./middleware/errorMiddleware'));

module.exports = app;
