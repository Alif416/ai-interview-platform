const http = require('http')
const { Server } = require('socket.io')
const app = require('./server')
const config = require('./config/config')
const { connectDB } = require('./config/database')
const { setupRoomHandlers } = require('./sockets/roomHandler')

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
})

setupRoomHandlers(io)

connectDB().then(() => {
  server.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`)
    console.log(`🌍 Environment: ${config.NODE_ENV}`)
    console.log(`📋 API Base: http://localhost:${config.PORT}${config.API_VERSION}`)
    console.log(`🔌 WebSocket ready`)
  })
})
