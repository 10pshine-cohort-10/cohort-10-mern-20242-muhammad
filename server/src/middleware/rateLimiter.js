'use strict';

const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'));
  },
});

module.exports = { loginRateLimiter };
