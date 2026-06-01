const express = require('express')
const router = express.Router()
const {
  generateQuestions,
  evaluateAnswer,
  streamInterview
} = require('../controllers/aiController')
const { authenticate } = require('../middleware/auth')

// All AI routes require authentication
router.use(authenticate)

router.post('/questions', generateQuestions)
router.post('/evaluate', evaluateAnswer)
router.post('/interview/stream', streamInterview)

module.exports = router