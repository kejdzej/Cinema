const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Parse DATABASE_URL manually to ensure proper configuration
const parseDatabaseUrl = (url) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port,
      database: parsed.pathname.slice(1),
      user: parsed.username,
      password: parsed.password,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  } catch (error) {
    logger.error('Failed to parse DATABASE_URL:', error);
    throw error;
  }
};

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);

logger.info('Database connection config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: dbConfig.ssl
});

const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to run queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error('Database query error', { text, error: err.message });
    throw err;
  }
};

// Helper function to get a single row
const getRow = async (text, params) => {
  const result = await query(text, params);
  return result.rows[0] || null;
};

// Helper function to get multiple rows
const getRows = async (text, params) => {
  const result = await query(text, params);
  return result.rows;
};

module.exports = {
  query,
  getRow,
  getRows,
  pool
};
