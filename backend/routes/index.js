const express = require('express')
const router = express.Router()
const sessionRoutes = require('./sessionRoutes')
const authRoutes = require('./authRoutes')

router.use('/auth', authRoutes)
router.use('/sessions', sessionRoutes)

module.exports = router