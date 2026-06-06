const express = require('express')
const router = express.Router()
const { register, login, logout, verifyEmail, resendVerification, getMe } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../utils/validators')

router.post('/register', registerLimiter, validate(registerSchema), register)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerification)
router.get('/me', authenticate, getMe)

module.exports = router
