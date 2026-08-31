/**
 * Base custom error class for all application errors
 * Provides consistent error handling across the app
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message)
    this.statusCode = statusCode
    this.errorCode = errorCode
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      success: false,
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    }
  }
}

module.exports = AppError
