/**
 * Global Error Handler Middleware
 * Catches and formats all errors consistently
 * Logs errors with context
 */

const ApiResponse = require('../utils/apiResponse')
const { AppError, ValidationError, AuthError, NotFoundError } = require('../core/errors')
const Logger = require('../core/logger/Logger')

const logger = new Logger('ErrorHandler')

const errorHandler = (err, req, res, next) => {
  // Log all errors with context
  logger.error('Unhandled Error', err, {
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  })

  // Handle custom app errors
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode, err.errors || null)
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
    return ApiResponse.badRequest(res, 'Validation failed', errors)
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return ApiResponse.badRequest(res, `Duplicate entry for field: ${err.meta?.target?.[0] || 'unknown'}`)
  }

  if (err.code === 'P2025') {
    return ApiResponse.notFound(res, 'Resource not found')
  }

  // Default: generic server error (don't expose internals to users)
  return ApiResponse.error(res, 'Internal server error', 500)
}

// Catches 404s for routes not found
const notFoundHandler = (req, res) => {
  ApiResponse.notFound(res, `Route ${req.originalUrl} does not exist`)
}

module.exports = { errorHandler, notFoundHandler }