'use strict';

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database:
    process.env.NODE_ENV === 'test'
      ? process.env.DB_TEST_NAME || 'notes_app_test'
      : process.env.DB_NAME || 'notes_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Execute a SQL query using pool.execute (auto-prepared statement).
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>} [rows, fields]
 */
async function query(sql, params) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return [rows, fields];
  } catch (err) {
    console.error('Database query failed:', err.message);
    throw err;
  }
}

/**
 * Test MySQL database connectivity.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return { success: true, message: 'Database connection established successfully' };
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return { success: false, message: err.message, code: err.code };
  }
}

/**
 * Execute multiple queries within a single database transaction.
 * @param {Function} callback (connection) => Promise<T>
 * @returns {Promise<T>}
 */
async function transaction(callback) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    console.error('Database transaction rolled back:', error.message);
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, testConnection, transaction };
