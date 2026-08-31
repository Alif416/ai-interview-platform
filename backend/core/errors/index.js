const AppError = require('./AppError')
const AuthError = require('./AuthError')
const ValidationError = require('./ValidationError')

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors = null) {
    super(message, 400, 'BAD_REQUEST')
    this.errors = errors
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors
    }
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR')
  }
}

module.exports = {
  AppError,
  AuthError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
  InternalServerError
}
