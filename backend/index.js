const http = require('http')
const { Server } = require('socket.io')
const { WebSocketServer } = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')
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

// Yjs WebSocket server for collaborative editing (separate port to avoid Socket.IO conflict)
const YJS_PORT = Number(config.PORT) + 1
const wss = new WebSocketServer({ port: YJS_PORT })
wss.on('connection', setupWSConnection)

connectDB().then(() => {
  server.listen(config.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${config.PORT}`)
    console.log(`🌍 Environment: ${config.NODE_ENV}`)
    console.log(`📋 API Base: http://localhost:${config.PORT}${config.API_VERSION}`)
    console.log(`🔌 WebSocket (Socket.IO) ready`)
    console.log(`📝 Yjs collaboration WebSocket on ws://localhost:${YJS_PORT}`)
  })
})
