const express = require('express')
const config = require('./config/config')
const logger = require('./middleware/logger')
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler')
const routes = require('./routes/index')

const app = express()

// ── Core Middleware ──────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)

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

// ── Error Handling (MUST be last) ────────────────
app.use('*', notFoundHandler)
app.use(errorHandler)

// ── Start Server ─────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${config.PORT}`)
  console.log(`🌍 Environment: ${config.NODE_ENV}`)
  console.log(`📋 API Base URL: http://localhost:${config.PORT}${config.API_VERSION}`)
})