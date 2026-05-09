// Central route registry — all routes registered here
const express = require('express')
const router = express.Router()
const sessionRoutes = require('./sessionRoutes')

router.use('/sessions', sessionRoutes)

// We'll add more routes here later:
// router.use('/users', userRoutes)
// router.use('/questions', questionRoutes)

module.exports = router