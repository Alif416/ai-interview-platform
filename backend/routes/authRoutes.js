const express = require('express')
const router = express.Router()
const {
  register, login, logout,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getMe, changePassword, deleteAccount
} = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const validate = require('../middleware/validate')
const {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
  changePasswordSchema, deleteAccountSchema,
} = require('../utils/validators')

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/logout', logout)
router.get('/verify-email', verifyEmail)
router.post('/resend-verification', resendVerification)
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', validate(resetPasswordSchema), resetPassword)
router.get('/me', authenticate, getMe)
router.put('/change-password', authenticate, validate(changePasswordSchema), changePassword)
router.delete('/delete-account', authenticate, validate(deleteAccountSchema), deleteAccount)

module.exports = router
