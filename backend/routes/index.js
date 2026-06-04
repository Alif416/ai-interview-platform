const express = require('express')
const router = express.Router()
const sessionRoutes = require('./sessionRoutes')
const authRoutes = require('./authRoutes')
const aiRoutes = require('./aiRoutes')
const performanceRoutes = require('./performanceRoutes')
const problemRoutes = require('./problemRoutes')

router.use('/auth', authRoutes)
router.use('/sessions', sessionRoutes)
router.use('/ai', aiRoutes)
router.use('/performance', performanceRoutes)
router.use('/problems', problemRoutes)

module.exports = router