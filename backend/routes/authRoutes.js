const express = require('express')
const router = express.Router()
const { register, login, getMe } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { authLimiter } = require('../middleware/rateLimit')
const validate = require('../middleware/validate')
const { registerSchema, loginSchema } = require('../utils/validators')

// validate middleware runs BEFORE controller
router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.get('/me', authenticate, getMe)

module.exports = router