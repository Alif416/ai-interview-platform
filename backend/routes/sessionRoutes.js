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

// Public — anyone can view sessions
router.get('/', getAllSessions)
router.get('/:id', getSessionById)

// Protected — must be logged in
router.post('/', authenticate, authorize('INTERVIEWER', 'ADMIN'), createSession)
router.put('/:id', authenticate, authorize('INTERVIEWER', 'ADMIN'), updateSession)
router.delete('/:id', authenticate, authorize('ADMIN'), deleteSession)

module.exports = router