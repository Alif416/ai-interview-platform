const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { prisma } = require('../config/database')
const { generateToken } = require('../utils/jwt')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const config = require('../config/config')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService')

const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: config.COOKIE_MAX_AGE,
}

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
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  const user = await prisma.user.create({
    data: {
      name, username, email, password: hashedPassword, role,
      verificationToken,
      verificationTokenExpiry,
    },
    select: { id: true, name: true, username: true, email: true, role: true, createdAt: true }
  })

  try {
    await sendVerificationEmail(email, name, verificationToken)
  } catch (emailErr) {
    console.error('Verification email failed to send:', emailErr.message)
  }

  ApiResponse.created(res, { email: user.email }, 'Registration successful. Please check your email to verify your account.')
})

// GET /api/v1/auth/verify-email?token=...
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query

  if (!token) return ApiResponse.badRequest(res, 'Verification token is required')

  const user = await prisma.user.findUnique({
    where: { verificationToken: token }
  })

  if (!user) return ApiResponse.badRequest(res, 'Invalid or expired verification link')

  if (user.verificationTokenExpiry < new Date()) {
    return ApiResponse.badRequest(res, 'Verification link has expired. Please request a new one.')
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    }
  })

  ApiResponse.success(res, null, 'Email verified successfully. You can now log in.')
})

// POST /api/v1/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email) return ApiResponse.badRequest(res, 'Email is required')

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to avoid email enumeration
  if (!user || user.isVerified) {
    return ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.')
  }

  const verificationToken = crypto.randomBytes(32).toString('hex')
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken, verificationTokenExpiry }
  })

  await sendVerificationEmail(email, user.name, verificationToken)

  ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.')
})

// POST /api/v1/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return the same response to prevent email enumeration
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

  const hashedPassword = await bcrypt.hash(password, 12)

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
    select: { id: true, email: true, username: true, name: true, password: true, role: true, isVerified: true, createdAt: true }
  })

  if (!user) {
    return ApiResponse.unauthorized(res, 'Invalid email or password')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return ApiResponse.unauthorized(res, 'Invalid email or password')
  }

  if (!user.isVerified) {
    return ApiResponse.error(res, 'Please verify your email before logging in. Check your inbox for the verification link.', 403)
  }

  const token = generateToken({ userId: user.id, role: user.role })
  const { password: _, isVerified: __, ...userWithoutSensitiveFields } = user

  res.cookie('token', token, cookieOptions)
  ApiResponse.success(res, { user: userWithoutSensitiveFields }, 'Login successful')
})

// POST /api/v1/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: config.NODE_ENV === 'production' })
  ApiResponse.success(res, null, 'Logged out successfully')
})

// GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, req.user, 'User retrieved successfully')
})

module.exports = { register, login, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, getMe }
