const express = require('express')
const router = express.Router()
const {
  generateQuestions,
  evaluateAnswer,
  streamInterview
} = require('../controllers/aiController')
const { authenticate } = require('../middleware/auth')
const { aiLimiter } = require('../middleware/rateLimit')

// All AI routes require authentication then rate limiting (keyed by user ID)
router.use(authenticate, aiLimiter)

router.post('/questions', generateQuestions)
router.post('/evaluate', evaluateAnswer)
router.post('/interview/stream', streamInterview)

module.exports = router