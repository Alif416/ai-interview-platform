const bcrypt = require('bcrypt')
const { prisma } = require('../config/database')
const { generateToken } = require('../utils/jwt')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ])
  if (existingEmail) return ApiResponse.badRequest(res, 'Email already registered')
  if (existingUsername) return ApiResponse.badRequest(res, 'Username already taken')

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, username, email, password: hashedPassword, role },
    select: { id: true, name: true, username: true, email: true, role: true, createdAt: true }
  })

  const token = generateToken({ userId: user.id, role: user.role })

  ApiResponse.created(res, { user, token }, 'Registration successful')
})

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, username: true, name: true, password: true, role: true, createdAt: true }
  })

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