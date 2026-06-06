const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { loginLimiter, registerLimiter } = require('../middleware/rateLimit')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../utils/validators')

// validate middleware runs BEFORE controller
router.post('/register', registerLimiter, validate(registerSchema), register)
router.post('/login', loginLimiter, validate(loginSchema), login)
router.get('/me', authenticate, getMe)

module.exports = router