require('dotenv').config()

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_VERSION: '/api/v1',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60 * 1000,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173'
}

module.exports = config