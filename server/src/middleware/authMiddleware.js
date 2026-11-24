'use strict';

const authService = require('../services/authService');

/**
 * Protect routes by verifying the JWT cookie.
 */
async function protect(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required', code: 'MISSING_TOKEN' });
  }

  try {
    const decoded = authService.verifyToken(token);
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token', code: 'INVALID_TOKEN' });
  }
}

module.exports = { protect };
