const express = require('express')
const router = express.Router()
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
} = require('../controllers/sessionController')
const { authenticate, authorize } = require('../middleware/auth')
const validate = require('../middleware/validate')
const {
  createSessionSchema,
  updateSessionSchema,
  sessionQuerySchema
} = require('../utils/validators')

// Public
router.get('/', validate(sessionQuerySchema, 'query'), getAllSessions)
router.get('/:id', getSessionById)

// Protected
router.post(
  '/',
  authenticate,
  authorize('INTERVIEWER', 'ADMIN'),
  validate(createSessionSchema),
  createSession
)

router.put(
  '/:id',
  authenticate,
  authorize('INTERVIEWER', 'ADMIN'),
  validate(updateSessionSchema),
  updateSession
)

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  deleteSession
)

module.exports = router