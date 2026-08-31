require('dotenv').config()

const { Pool } = require('pg')

/**
 * PostgreSQL Connection Pool
 * Single instance across entire app for connection reuse
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,           // Maximum number of connections
  idleTimeoutMillis: 30000,  // Idle connection timeout
  connectionTimeoutMillis: 2000,  // Connection timeout
})

// Test connection on startup
const connectDB = async () => {
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('Database connected successfully at', result.rows[0].now)
    return pool
  } catch (error) {
    console.error('Database connection failed:', error.message)
    process.exit(1) // Crash the server — can't run without DB
  }
}

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

module.exports = { pool, connectDB }