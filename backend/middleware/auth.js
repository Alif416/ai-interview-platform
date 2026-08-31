/**
 * Authentication Middleware
 * Verifies JWT token and loads user
 * Uses repository for data access
 */

const { verifyToken } = require('../utils/jwt')
const { AuthError, ForbiddenError } = require('../core/errors')

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
      throw new AuthError('No token provided', 'NO_TOKEN')
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      throw new AuthError('Invalid or expired token', 'INVALID_TOKEN')
    }

    const userRepository = req.container.userRepository
    const user = await userRepository.findByIdWithoutThrow(decoded.userId, {
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      throw new AuthError('User no longer exists', 'USER_NOT_FOUND')
    }

    req.user = user
    next()
  } catch (error) {
    next(error) // Pass to error handler
  }
}

/**
 * Role-based access control middleware
 * Usage: authorize('ADMIN', 'INTERVIEWER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthError('User not authenticated', 'NOT_AUTHENTICATED'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not authorized for this action`))
    }

    next()
  }
}

module.exports = { authenticate, authorize }
