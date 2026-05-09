// Catches ALL unhandled errors in your entire app
// Without this, your server crashes and shows ugly errors to users

const ApiResponse = require('../utils/apiResponse')

const errorHandler = (err, req, res, next) => {
  console.error('🔥 Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return ApiResponse.badRequest(res, err.message)
  }

  if (err.name === 'UnauthorizedError') {
    return ApiResponse.unauthorized(res)
  }

  // Generic server error (don't expose internals to users!)
  return ApiResponse.error(
    res,
    'Internal server error',
    500
  )
}

// Catches async errors that weren't caught
const notFoundHandler = (req, res) => {
  ApiResponse.notFound(res, `Route ${req.originalUrl} does not exist`)
}

module.exports = { errorHandler, notFoundHandler }