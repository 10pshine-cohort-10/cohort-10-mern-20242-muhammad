'use strict';

require('dotenv').config();
const { testConnection } = require('../src/config/db');

async function run() {
  const dbName = process.env.NODE_ENV === 'test'
    ? (process.env.DB_TEST_NAME || 'notes_app_test')
    : (process.env.DB_NAME || 'notes_app');

  console.log('Testing MySQL database connection...');
  console.log(`Target: ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${dbName}`);

  try {
    const result = await testConnection();

    if (result.success) {
      console.log('✓ Success:', result.message);
      process.exit(0);
    } else {
      console.error('✗ Connection Failed:', result.message, `(${result.code || 'UNKNOWN'})`);
      process.exit(1);
    }
  } catch (err) {
    console.error('✗ Unexpected Error:', err.message || err);
    process.exit(1);
  }
}

run();
