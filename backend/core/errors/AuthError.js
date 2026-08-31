const AppError = require('./AppError')

class AuthError extends AppError {
  constructor(message = 'Authentication failed', errorCode = 'AUTH_ERROR') {
    super(message, 401, errorCode)
  }
}

module.exports = AuthError
