const express = require('express')
const router = express.Router()
const { getAllProblems, getProblemById, runCode, syncProblems } = require('../controllers/problemController')
const { authenticate } = require('../middleware/auth')

router.get('/', getAllProblems)
router.post('/sync', authenticate, syncProblems)
router.get('/:id', getProblemById)
router.post('/:id/run', authenticate, runCode)

module.exports = router
