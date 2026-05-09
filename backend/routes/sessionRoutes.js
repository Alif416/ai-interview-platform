const express = require('express')
const router = express.Router()
const {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
} = require('../controllers/sessionController')

// Clean, readable route definitions
router.get('/', getAllSessions)
router.get('/:id', getSessionById)
router.post('/', createSession)
router.put('/:id', updateSession)
router.delete('/:id', deleteSession)

module.exports = router