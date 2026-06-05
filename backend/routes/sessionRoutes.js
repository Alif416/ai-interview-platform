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

// All session routes require authentication
router.use(authenticate)

router.get('/', validate(sessionQuerySchema, 'query'), getAllSessions)
router.get('/:id', getSessionById)

router.post(
  '/',
  authorize('INTERVIEWER', 'ADMIN'),
  validate(createSessionSchema),
  createSession
)

router.put(
  '/:id',
  authorize('INTERVIEWER', 'ADMIN'),
  validate(updateSessionSchema),
  updateSession
)

router.delete(
  '/:id',
  authorize('ADMIN'),
  deleteSession
)

module.exports = router
