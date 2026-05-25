require('dotenv').config()

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_VERSION: '/api/v1',
  DATABASE_URL: process.env.DATABASE_URL
}

module.exports = config