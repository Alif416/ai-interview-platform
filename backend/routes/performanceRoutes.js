const express = require('express')
const router = express.Router()
const { getMyPerformance, getInterviewerStats } = require('../controllers/performanceController')
const { authenticate, authorize } = require('../middleware/auth')

router.use(authenticate)

router.get('/', getMyPerformance)
router.get('/interviewer', authorize('INTERVIEWER', 'ADMIN'), getInterviewerStats)

module.exports = router
