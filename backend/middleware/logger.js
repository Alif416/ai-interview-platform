// Logs every request — critical for debugging in production
// Google engineers LIVE by logs

const logger = (req, res, next) => {
  const start = Date.now()

  // When response finishes, log the details
  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    }

    // Color code by status
    if (res.statusCode >= 500) {
      console.error('❌ ERROR   |', JSON.stringify(log))
    } else if (res.statusCode >= 400) {
      console.warn('⚠️  WARNING |', JSON.stringify(log))
    } else {
      console.log('✅ SUCCESS |', JSON.stringify(log))
    }
  })

  next() // CRITICAL: Always call next() or request hangs forever
}

module.exports = logger