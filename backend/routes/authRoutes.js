const express = require('express')
const router = express.Router()
const {
  register, login, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getMe
} = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { loginLimiter, registerLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../utils/validators')

router.post('/register', registerLimiter, validate(registerSchema), register)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerification)
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)
router.get('/me', authenticate, getMe)

module.exports = router
