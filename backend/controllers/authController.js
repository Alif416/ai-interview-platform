const bcrypt = require('bcrypt')
const { prisma } = require('../config/database')
const { generateToken } = require('../utils/jwt')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  // No manual validation needed — Zod handled it already
  const { name, email, password, role } = req.body

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return ApiResponse.badRequest(res, 'Email already registered')
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  })

  const token = generateToken({ userId: user.id, role: user.role })

  ApiResponse.created(res, { user, token }, 'Registration successful')
})

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return ApiResponse.unauthorized(res, 'Invalid email or password')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return ApiResponse.unauthorized(res, 'Invalid email or password')
  }

  const token = generateToken({ userId: user.id, role: user.role })
  const { password: _, ...userWithoutPassword } = user

  ApiResponse.success(res, { user: userWithoutPassword, token }, 'Login successful')
})

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, req.user, 'User retrieved successfully')
})

module.exports = { register, login, getMe }