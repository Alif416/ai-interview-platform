const app = require('./server')
const config = require('./config/config')
const { connectDB } = require('./config/database')

connectDB().then(() => {
  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`)
    console.log(`🌍 Environment: ${config.NODE_ENV}`)
    console.log(`📋 API Base: http://localhost:${config.PORT}${config.API_VERSION}`)
  })
})