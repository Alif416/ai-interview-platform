const express = require('express')
const router = express.Router()
const sessionRoutes = require('./sessionRoutes')
const authRoutes = require('./authRoutes')
const aiRoutes = require('./aiRoutes')

router.use('/auth', authRoutes)
router.use('/sessions', sessionRoutes)
router.use('/ai', aiRoutes)

module.exports = router