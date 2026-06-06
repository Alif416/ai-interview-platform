const express = require('express')
const cookieParser = require('cookie-parser')
const config = require('./config/config')
const logger = require('./middleware/logger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const { globalLimiter } = require('./middleware/rateLimit')
const routes = require('./routes/index')
const cors = require('cors')
const app = express()

// ── Core Middleware ──────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(logger)
app.use(globalLimiter)

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))


// ── Health Check ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  })
})

// ── API Routes ───────────────────────────────────
app.use(config.API_VERSION, routes)

// ── Error Handling ────────────────────────────────
app.use('/{*path}', notFoundHandler)
app.use(errorHandler)

// Export app for testing
module.exports = app