const { z } = require('zod')
const ApiResponse = require('../utils/apiResponse')

// validate(schema) returns a middleware function
// Usage: router.post('/', validate(createSessionSchema), controller)

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Parse and validate the data
      // .parse() throws if invalid, returns cleaned data if valid
      const validated = schema.parse(req[source])

      // Replace req[source] with cleaned/transformed data
      // (trimmed strings, lowercased emails, etc.)
      req[source] = validated

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors into readable messages
        const errors = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))

        return ApiResponse.badRequest(
          res,
          'Validation failed',
          errors
        )
      }

      // Unknown error — pass to global error handler
      next(error)
    }
  }
}

module.exports = validate