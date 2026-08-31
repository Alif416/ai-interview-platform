const AppError = require('./AppError')

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 400, 'VALIDATION_ERROR')
    this.errors = errors
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors
    }
  }
}

module.exports = ValidationError
