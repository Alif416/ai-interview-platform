const http = require('http')
const { Server } = require('socket.io')
const { WebSocketServer } = require('ws')
const { setupWSConnection } = require('y-websocket/bin/utils')
const createApp = require('./server')
const config = require('./config/config')
const { connectDB } = require('./config/database')
const { connectRedis, disconnectRedis } = require('./config/redis')
const { setupRoomHandlers } = require('./sockets/roomHandler')
const Logger = require('./core/logger/Logger')
const { bootstrapContainer } = require('./core/container/bootstrap')

const logger = new Logger('Server')

async function startServer() {
  try {
    // Initialize database and cache connections
    logger.info('Connecting to database and cache...')
    await connectDB()
    await connectRedis()

    // Bootstrap service container
    logger.info('Initializing service container...')
    const container = await bootstrapContainer()

    // Verify email service
    const emailService = container.resolve('services.email')
    try {
      await emailService.verify()
    } catch (err) {
      logger.warn('Email service verification failed', err)
      logger.warn('Emails will not send until BREVO_API_KEY is configured')
    }

    // Create Express app with DI container
    const app = createApp(container)
    const server = http.createServer(app)

    const ALLOWED_ORIGINS = [
      'http://localhost:5173',
      process.env.CLIENT_URL,
    ].filter(Boolean)

    // Setup Socket.IO
    const io = new Server(server, {
      cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
        credentials: true
      }
    })

    setupRoomHandlers(io)

    // Setup Yjs WebSocket server for collaborative editing
    const YJS_PORT = Number(config.PORT) + 1
    const wss = new WebSocketServer({ port: YJS_PORT })
    wss.on('connection', setupWSConnection)

    // Start server
    server.listen(config.PORT, () => {
      logger.success(`Server running on http://localhost:${config.PORT}`)
      logger.info(`Environment: ${config.NODE_ENV}`)
      logger.info(`API Base: http://localhost:${config.PORT}${config.API_VERSION}`)
      logger.info(`WebSocket (Socket.IO) ready`)
      logger.info(`Yjs collaboration WebSocket on ws://localhost:${YJS_PORT}`)
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.warn('SIGTERM received, shutting down gracefully...')
      await disconnectRedis()
      server.close(() => {
        logger.success('Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', async () => {
      logger.warn('SIGINT received, shutting down gracefully...')
      await disconnectRedis()
      server.close(() => {
        logger.success('Server closed')
        process.exit(0)
      })
    })

  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

startServer()
