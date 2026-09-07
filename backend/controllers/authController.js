const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { prisma } = require('../config/database')
const { generateToken } = require('../utils/jwt')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const config = require('../config/config')
const { sendPasswordResetEmail, validateEmailDomain } = require('../services/emailService')

const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: config.COOKIE_MAX_AGE,
}

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body

  // Reject emails with non-existent domains before doing anything else
  const domainValid = await validateEmailDomain(email)
  if (!domainValid) {
    return ApiResponse.badRequest(res, 'Email address is invalid or does not exist')
  }

  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ])
  if (existingEmail) return ApiResponse.badRequest(res, 'Email already registered')
  if (existingUsername) return ApiResponse.badRequest(res, 'Username already taken')

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { name, username, email, password: hashedPassword, role },
    select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
  })

  const token = generateToken({ userId: user.id, role: user.role })

  res.cookie('token', token, cookieOptions)
  ApiResponse.created(res, { user, token }, 'Registration successful')
})

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return ApiResponse.success(res, null, 'If that email is registered, a reset link has been sent.')
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExpiry }
  })

  try {
    await sendPasswordResetEmail(email, user.name, resetToken)
  } catch (emailErr) {
    console.error('Password reset email failed to send:', emailErr.message)
  }

  ApiResponse.success(res, null, 'If that email is registered, a reset link has been sent.')
})

// POST /api/v1/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body

  if (!token) return ApiResponse.badRequest(res, 'Reset token is required')

  const user = await prisma.user.findUnique({ where: { resetToken: token } })

  if (!user) return ApiResponse.badRequest(res, 'Invalid or expired reset link')

  if (user.resetTokenExpiry < new Date()) {
    return ApiResponse.badRequest(res, 'Reset link has expired. Please request a new one.')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    }
  })

  ApiResponse.success(res, null, 'Password reset successfully. You can now log in with your new password.')
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

  res.cookie('token', token, cookieOptions)
  ApiResponse.success(res, { user: userWithoutPassword, token }, 'Login successful')
})

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax' })
  ApiResponse.success(res, null, 'Logged out successfully')
})

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, req.user, 'User retrieved successfully')
})

// PUT /api/v1/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return ApiResponse.notFound(res, 'User not found')

  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) return ApiResponse.badRequest(res, 'Current password is incorrect')

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  ApiResponse.success(res, null, 'Password changed successfully')
})

// DELETE /api/v1/auth/delete-account
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return ApiResponse.notFound(res, 'User not found')

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return ApiResponse.badRequest(res, 'Password is incorrect')

  await prisma.user.delete({ where: { id: user.id } })

  res.clearCookie('token', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  })
  ApiResponse.success(res, null, 'Account deleted successfully')
})

module.exports = { register, login, logout, forgotPassword, resetPassword, getMe, changePassword, deleteAccount }
