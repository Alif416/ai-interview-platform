const { verifyToken } = require('../utils/jwt')
const { prisma } = require('../config/database')
const ApiResponse = require('../utils/apiResponse')

const authenticate = async (req, res, next) => {
  try {
    // Read from httpOnly cookie first, fall back to Authorization header
    let token = req.cookies?.token

    if (!token) {
      const authHeader = req.headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1]
      }
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'No token provided')
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return ApiResponse.unauthorized(res, 'Invalid or expired token')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      return ApiResponse.unauthorized(res, 'User no longer exists')
    }

    req.user = user
    next()
  } catch (error) {
    return ApiResponse.unauthorized(res, 'Authentication failed')
  }
}

// Role-based access control
// Usage: authorize('ADMIN', 'INTERVIEWER')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Role ${req.user.role} is not authorized for this action`,
        403
      )
    }
    next()
  }
}

module.exports = { authenticate, authorize }
