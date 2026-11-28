'use strict';

const mysql = require('mysql2/promise');
const logger = require('./logger');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
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
 * @typedef {Error & { code?: string, errno?: number, sqlState?: string, sqlMessage?: string }} DatabaseError
 */

/**
 * Execute a SQL query using pool.execute (auto-prepared statement).
 * @template [T=import('mysql2/promise').QueryResult]
 * @param {string} sql
 * @param {Array<unknown>} params
 * @returns {Promise<[T, import('mysql2/promise').FieldPacket[]]>}
 */
async function query(sql, params) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return [rows, fields];
  } catch (err) {
    const dbErr = /** @type {DatabaseError} */ (err);
    logger.error(
      { err: { message: dbErr.message, code: dbErr.code }, sql },
      'Database query failed'
    );
    throw err;
  }
}

/**
 * Test MySQL database connectivity.
 * @returns {Promise<{ success: boolean, message: string, code?: string }>}
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    logger.info('Database connection established successfully');
    return { success: true, message: 'Database connection established successfully' };
  } catch (err) {
    const dbErr = /** @type {DatabaseError} */ (err);
    logger.error({ err: { message: dbErr.message, code: dbErr.code } }, 'Database connection failed');
    return { success: false, message: dbErr.message, code: dbErr.code };
  }
}

/**
 * Execute multiple queries within a single database transaction.
 * @template T
 * @param {(connection: import('mysql2/promise').PoolConnection) => Promise<T>} callback
 * @returns {Promise<T>}
 */
async function transaction(callback) {
  const conn = await pool.getConnection();
  let transactionStarted = false;

  try {
    await conn.beginTransaction();
    transactionStarted = true;

    const result = await callback(conn);

    await conn.commit();
    transactionStarted = false;

    return result;
  } catch (error) {
    const dbErr = /** @type {DatabaseError} */ (error);
    logger.error(
      { err: { message: dbErr.message, code: dbErr.code } },
      'Database transaction failed'
    );

    if (transactionStarted) {
      try {
        await conn.rollback();
      } catch (rollbackError) {
        const rbErr = /** @type {DatabaseError} */ (rollbackError);
        logger.error(
          {
            err: {
              message: rbErr.message,
              code: rbErr.code,
            },
          },
          'Database transaction rollback failed'
        );
      }
    }

    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, testConnection, transaction };
