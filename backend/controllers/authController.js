const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const config = require('../config/config')

/**
 * Auth Controller
 * Orchestrates HTTP requests/responses for authentication
 * Delegates business logic to AuthService
 * All errors handled by global error handler
 */

const register = asyncHandler(async (req, res) => {
  const { authService, cacheService } = req.container
  const result = await authService.register(req.body, cacheService)
  ApiResponse.created(res, result, 'Registration successful. Please check your email to verify your account.')
})

const verifyEmail = asyncHandler(async (req, res) => {
  const { authService, cacheService } = req.container
  const { token } = req.query
  const result = await authService.verifyEmail(token, cacheService)
  ApiResponse.success(res, null, result.message)
})

const resendVerification = asyncHandler(async (req, res) => {
  const { authService, cacheService } = req.container
  const { email } = req.body
  const result = await authService.resendVerification(email, cacheService)
  ApiResponse.success(res, null, result.message)
})

const login = asyncHandler(async (req, res) => {
  const { authService } = req.container
  const { email, password } = req.body

  const { token, user, cookieOptions } = await authService.login({ email, password })

  res.cookie('token', token, cookieOptions)
  ApiResponse.success(res, { user, token }, 'Login successful')
})

const logout = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  }
  res.clearCookie('token', cookieOptions)
  ApiResponse.success(res, null, 'Logged out successfully')
})

const getMe = asyncHandler(async (req, res) => {
  ApiResponse.success(res, req.user, 'User retrieved successfully')
})

const forgotPassword = asyncHandler(async (req, res) => {
  const { authService } = req.container
  const { email } = req.body
  const result = await authService.forgotPassword(email)
  ApiResponse.success(res, null, result.message)
})

const resetPassword = asyncHandler(async (req, res) => {
  const { authService } = req.container
  const result = await authService.resetPassword(req.body)
  ApiResponse.success(res, null, result.message)
})

const changePassword = asyncHandler(async (req, res) => {
  const { authService } = req.container
  const result = await authService.changePassword(req.user.id, req.body)
  ApiResponse.success(res, null, result.message)
})

const deleteAccount = asyncHandler(async (req, res) => {
  const { userRepository } = req.container
  const { password } = req.body
  const { authService } = req.container

  const user = await userRepository.findByIdWithoutThrow(req.user.id)
  if (!user) throw new NotFoundError('User')

  const bcrypt = require('bcrypt')
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    const { BadRequestError } = require('../core/errors')
    throw new BadRequestError('Password is incorrect')
  }

  await userRepository.deleteUserPermanently(req.user.id)

  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
  }
  res.clearCookie('token', cookieOptions)
  ApiResponse.success(res, null, 'Account deleted successfully')
})

module.exports = { register, login, logout, verifyEmail, resendVerification, forgotPassword, resetPassword, getMe, changePassword, deleteAccount }
