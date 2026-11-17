'use strict';

const { query } = require('../config/db');

/**
 * Find a user by email, including password_hash for auth.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const [rows] = await query(
    'SELECT id, name, username, email, password_hash, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by username (without password_hash).
 * @param {string} username
 * @returns {Promise<object|null>}
 */
async function findByUsername(username) {
  const [rows] = await query(
    'SELECT id, name, username, email FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

/**
 * Find a user by ID (without password_hash).
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await query(
    'SELECT id, name, username, email, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

/**
 * Create a new user.
 * @param {{ name?: string, username?: string, email: string, password_hash: string }} data
 * @returns {Promise<{ id: number, name: string, username: string, email: string }>}
 */
async function create({ name, username, email, password_hash }) {
  const finalUsername = username || email.split('@')[0];
  const finalName = name || finalUsername;
  const [result] = await query(
    'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)',
    [finalName, finalUsername, email, password_hash]
  );
  return { id: result.insertId, name: finalName, username: finalUsername, email };
}

/**
 * Update user profile (username and/or email).
 * @param {number} id
 * @param {{ username: string, email: string }} data
 */
async function updateProfile(id, { username, email }) {
  await query(
    'UPDATE users SET username = ?, email = ?, updated_at = NOW() WHERE id = ?',
    [username, email, id]
  );
}

/**
 * Update user password hash.
 * @param {number} id
 * @param {string} password_hash
 */
async function updatePassword(id, password_hash) {
  await query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [password_hash, id]
  );
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  create,
  updateProfile,
  updatePassword,
};
