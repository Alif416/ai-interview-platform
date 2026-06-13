const { verifyToken } = require('../utils/jwt')
const { prisma } = require('../config/database')

// In-memory room state
const rooms = new Map()

function getOrCreateRoom(sessionId) {
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, {
      participants: [],
      code: '',
      language: 'javascript',
      messages: [],
      selectedProblem: null,
    })
  }
  return rooms.get(sessionId)
}

function setupRoomHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('Authentication required'))

      const decoded = verifyToken(token)
      if (!decoded) return next(new Error('Invalid token'))

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, role: true },
      })

      if (!user) return next(new Error('User not found'))

      socket.user = user
      next()
    } catch {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join-room', async ({ sessionId }) => {
      try {
        // Verify the session exists and the user is allowed in
        const session = await prisma.interviewSession.findUnique({
          where: { id: parseInt(sessionId) },
          select: { interviewerId: true, candidateId: true, status: true },
        })

        if (!session) {
          return socket.emit('room-error', { message: 'Session not found' })
        }

        const isAllowed =
          socket.user.role === 'ADMIN' ||
          session.interviewerId === socket.user.id ||
          session.candidateId  === socket.user.id

        if (!isAllowed) {
          return socket.emit('room-error', { message: 'You are not invited to this session' })
        }

        const room = getOrCreateRoom(sessionId)

        // Remove stale entry for this user (handles reconnects)
        room.participants = room.participants.filter(
          (p) => p.userId !== socket.user.id
        )
        room.participants.push({
          userId: socket.user.id,
          name: socket.user.name,
          role: socket.user.role,
          socketId: socket.id,
        })

        socket.join(sessionId)
        socket.sessionId = sessionId

        socket.emit('room-state', {
          participants: room.participants,
          code: room.code,
          language: room.language,
          messages: room.messages,
          selectedProblem: room.selectedProblem,
        })

        socket.to(sessionId).emit('user-joined', {
          userId: socket.user.id,
          name: socket.user.name,
          participants: room.participants,
        })
      } catch {
        socket.emit('room-error', { message: 'Failed to join room' })
      }
    })

    socket.on('code-change', ({ sessionId, code }) => {
      const room = rooms.get(sessionId)
      if (!room) return
      room.code = code
      socket.to(sessionId).emit('code-change', { code })
    })

    socket.on('language-change', ({ sessionId, language }) => {
      const room = rooms.get(sessionId)
      if (!room) return
      room.language = language
      socket.to(sessionId).emit('language-change', { language })
    })

    socket.on('chat-message', ({ sessionId, message }) => {
      const room = rooms.get(sessionId)
      if (!room) return

      const msg = {
        id: Date.now(),
        userId: socket.user.id,
        name: socket.user.name,
        role: socket.user.role,
        message,
        timestamp: new Date().toISOString(),
      }

      room.messages.push(msg)
      if (room.messages.length > 100) room.messages.shift()

      io.to(sessionId).emit('chat-message', msg)
    })

    socket.on('chat-typing', ({ sessionId, isTyping }) => {
      socket.to(sessionId).emit('chat-typing', {
        userId: socket.user.id,
        name: socket.user.name,
        role: socket.user.role,
        isTyping,
      })
    })

    socket.on('select-problem', ({ sessionId, problemId }) => {
      const room = rooms.get(sessionId)
      if (!room) return

      const isAllowed =
        socket.user.role === 'INTERVIEWER' || socket.user.role === 'ADMIN'
      if (!isAllowed) return

      room.selectedProblem = problemId

      io.to(sessionId).emit('problem-selected', {
        problemId,
        selectedBy: socket.user.id,
        selectedByName: socket.user.name,
      })
    })

    socket.on('disconnect', () => {
      const sessionId = socket.sessionId
      if (!sessionId) return

      const room = rooms.get(sessionId)
      if (!room) return

      room.participants = room.participants.filter(
        (p) => p.socketId !== socket.id
      )

      socket.to(sessionId).emit('user-left', {
        userId: socket.user.id,
        name: socket.user.name,
        participants: room.participants,
      })

      if (room.participants.length === 0) {
        rooms.delete(sessionId)
      }
    })
  })
}

module.exports = { setupRoomHandlers }
