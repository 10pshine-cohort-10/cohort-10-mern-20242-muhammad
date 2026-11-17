'use strict';

require('dotenv').config();
const { testConnection } = require('../src/config/db');

async function run() {
  console.log('Testing MySQL database connection...');
  console.log(`Target: ${process.env.DB_USER || 'root'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'notes_app'}`);
  const result = await testConnection();
  if (result.success) {
    console.log('✓ Success:', result.message);
    process.exit(0);
  } else {
    console.error('✗ Connection Failed:', result.message, `(${result.code || 'UNKNOWN'})`);
    process.exit(1);
  }
}

run();

