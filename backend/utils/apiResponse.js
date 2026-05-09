// Standardized response format for entire API
// Every single response follows the same structure

class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }

  static error(res, message = 'Something went wrong', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    })
  }

  static created(res, data, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201)
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404)
  }

  static badRequest(res, message = 'Bad request', errors = null) {
    return ApiResponse.error(res, message, 400, errors)
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401)
  }
}

module.exports = ApiResponse