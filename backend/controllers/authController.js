const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { prisma } = require('../config/database')
const { getRedis } = require('../config/redis')
const { generateToken } = require('../utils/jwt')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const config = require('../config/config')
const { sendVerificationEmail, sendPasswordResetEmail, validateEmailDomain } = require('../services/emailService')

const PENDING_TTL = 24 * 60 * 60 // 24 hours in seconds

const cookieOptions = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: config.COOKIE_MAX_AGE,
}

// POST /api/v1/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body
  const redis = getRedis()

  // Reject emails with non-existent domains before doing anything else
  const domainValid = await validateEmailDomain(email)
  if (!domainValid) {
    return ApiResponse.badRequest(res, 'Email address is invalid or does not exist')
  }

  // Check DB for already-verified accounts
  const [existingEmail, existingUsername] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ])
  if (existingEmail) return ApiResponse.badRequest(res, 'Email already registered')
  if (existingUsername) return ApiResponse.badRequest(res, 'Username already taken')

  // Check Redis for pending (unverified) registrations with same username
  const pendingUsernameToken = await redis.get(`pending:username:${username}`)
  if (pendingUsernameToken) {
    const pendingData = await redis.get(`pending:reg:${pendingUsernameToken}`)
    if (pendingData) {
      const pending = JSON.parse(pendingData)
      if (pending.email !== email) {
        return ApiResponse.badRequest(res, 'Username already taken')
      }
    }
  }

  // If this email already has a pending registration, overwrite it
  const existingPendingToken = await redis.get(`pending:email:${email}`)
  if (existingPendingToken) {
    await redis.del(`pending:reg:${existingPendingToken}`)
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const token = crypto.randomBytes(32).toString('hex')

  const pendingData = JSON.stringify({ name, username, email, hashedPassword, role })

  await Promise.all([
    redis.set(`pending:reg:${token}`, pendingData, 'EX', PENDING_TTL),
    redis.set(`pending:email:${email}`, token, 'EX', PENDING_TTL),
    redis.set(`pending:username:${username}`, token, 'EX', PENDING_TTL),
  ])

  try {
    await sendVerificationEmail(email, name, token)
  } catch (err) {
    // Clean up Redis if email fails so user can retry
    await Promise.all([
      redis.del(`pending:reg:${token}`),
      redis.del(`pending:email:${email}`),
      redis.del(`pending:username:${username}`),
    ])
    console.error('Verification email failed:', err.message)
    return ApiResponse.error(res, 'Failed to send verification email. Please try again later.', 500)
  }

  ApiResponse.created(res, { email }, 'Registration successful. Please check your email to verify your account.')
})

// GET /api/v1/auth/verify-email?token=...
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query
  if (!token) return ApiResponse.badRequest(res, 'Verification token is required')

  const redis = getRedis()
  const rawData = await redis.get(`pending:reg:${token}`)

  if (!rawData) return ApiResponse.badRequest(res, 'Invalid or expired verification link')

  const { name, username, email, hashedPassword, role } = JSON.parse(rawData)

  // Guard against double-click / race condition
  const alreadyExists = await prisma.user.findUnique({ where: { email } })
  if (alreadyExists) {
    await redis.del(`pending:reg:${token}`, `pending:email:${email}`, `pending:username:${username}`)
    return ApiResponse.success(res, null, 'Email already verified. You can now log in.')
  }

  // Username might have been claimed by someone else during pending window
  const usernameTaken = await prisma.user.findUnique({ where: { username } })
  if (usernameTaken) {
    await redis.del(`pending:reg:${token}`, `pending:email:${email}`, `pending:username:${username}`)
    return ApiResponse.badRequest(res, 'Your username was taken while your verification was pending. Please register again with a different username.')
  }

  await prisma.user.create({
    data: { name, username, email, password: hashedPassword, role },
  })

  await Promise.all([
    redis.del(`pending:reg:${token}`),
    redis.del(`pending:email:${email}`),
    redis.del(`pending:username:${username}`),
  ])

  ApiResponse.success(res, null, 'Email verified successfully. You can now log in.')
})

// POST /api/v1/auth/resend-verification
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return ApiResponse.badRequest(res, 'Email is required')

  const redis = getRedis()
  const existingToken = await redis.get(`pending:email:${email}`)

  // Always return success to avoid email enumeration
  if (!existingToken) {
    return ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.')
  }

  const rawData = await redis.get(`pending:reg:${existingToken}`)
  if (!rawData) {
    return ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.')
  }

  const data = JSON.parse(rawData)
  const newToken = crypto.randomBytes(32).toString('hex')

  await Promise.all([
    redis.del(`pending:reg:${existingToken}`),
    redis.set(`pending:reg:${newToken}`, rawData, 'EX', PENDING_TTL),
    redis.set(`pending:email:${email}`, newToken, 'EX', PENDING_TTL),
    redis.set(`pending:username:${data.username}`, newToken, 'EX', PENDING_TTL),
  ])

  await sendVerificationEmail(email, data.name, newToken)

  ApiResponse.success(res, null, 'If that email exists and is unverified, a new link has been sent.')
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
  ApiResponse.success(res, { user: userWithoutPassword }, 'Login successful')
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
