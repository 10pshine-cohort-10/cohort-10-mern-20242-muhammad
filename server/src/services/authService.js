'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * @param {string} password
 * @returns {Promise<string>}
 */
function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token with 7-day expiry.
 * @param {object} payload
 * @returns {string}
 */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
};
