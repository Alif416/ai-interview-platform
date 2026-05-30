const bcrypt = require('bcrypt')
const { prisma } = require('../config/database')
const { generateToken } = require('../utils/jwt')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body

  // Validation
  const errors = []
  if (!name) errors.push('name is required')
  if (!email) errors.push('email is required')
  if (!password) errors.push('password is required')
  if (password && password.length < 6) {
    errors.push('password must be at least 6 characters')
  }

  if (errors.length > 0) {
    return ApiResponse.badRequest(res, 'Validation failed', errors)
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return ApiResponse.badRequest(res, 'Email already registered')
  }

  // Hash password — never store plain text
  // 12 = salt rounds (higher = more secure but slower)
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'CANDIDATE'
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  })

  // Generate token
  const token = generateToken({
    userId: user.id,
    role: user.role
  })

  ApiResponse.created(res, { user, token }, 'Registration successful')
})

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Validation
  if (!email || !password) {
    return ApiResponse.badRequest(res, 'Email and password are required')
  }

  // Find user — include password this time for comparison
  const user = await prisma.user.findUnique({
    where: { email }
  })

  // SECURITY: Same error message whether email or password is wrong
  // Never tell attackers which one failed
  if (!user) {
    return ApiResponse.unauthorized(res, 'Invalid email or password')
  }

  // Compare password with hash
  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return ApiResponse.unauthorized(res, 'Invalid email or password')
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    role: user.role
  })

  // Return user without password
  const { password: _, ...userWithoutPassword } = user

  ApiResponse.success(res, {
    user: userWithoutPassword,
    token
  }, 'Login successful')
})

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by authenticate middleware
  ApiResponse.success(res, req.user, 'User retrieved successfully')
})

module.exports = { register, login, getMe }