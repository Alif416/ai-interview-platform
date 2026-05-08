const express = require('express')
const app = express()
const PORT = 3000

app.use(express.json())

// ============================================
// TEMPORARY DATA (We'll replace with DB later)
// ============================================
let interviewSessions = [
  {
    id: 1,
    candidateName: 'John Doe',
    role: 'Software Engineer',
    level: 'L3',
    status: 'scheduled',
    scheduledAt: '2024-12-01T10:00:00Z'
  },
  {
    id: 2,
    candidateName: 'Jane Smith',
    role: 'Senior Engineer',
    level: 'L5',
    status: 'completed',
    scheduledAt: '2024-11-28T14:00:00Z'
  }
]

// ============================================
// ROUTES
// ============================================

// Health check — every production API has this
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// GET all sessions
app.get('/api/sessions', (req, res) => {
  res.json({
    success: true,
    count: interviewSessions.length,
    data: interviewSessions
  })
})

// GET single session by ID
app.get('/api/sessions/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const session = interviewSessions.find(s => s.id === id)

  if (!session) {
    return res.status(404).json({
      success: false,
      message: `Session with id ${id} not found`
    })
  }

  res.json({
    success: true,
    data: session
  })
})

// POST create new session
app.post('/api/sessions', (req, res) => {
  const { candidateName, role, level, scheduledAt } = req.body

  // Basic validation
  if (!candidateName || !role || !level) {
    return res.status(400).json({
      success: false,
      message: 'candidateName, role, and level are required'
    })
  }

  const newSession = {
    id: interviewSessions.length + 1,
    candidateName,
    role,
    level,
    status: 'scheduled',
    scheduledAt: scheduledAt || new Date().toISOString()
  }

  interviewSessions.push(newSession)

  res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: newSession
  })
})

// PUT update session status
app.put('/api/sessions/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const { status } = req.body
  
  const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled']
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status must be one of: ${validStatuses.join(', ')}`
    })
  }

  const sessionIndex = interviewSessions.findIndex(s => s.id === id)

  if (sessionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Session with id ${id} not found`
    })
  }

  interviewSessions[sessionIndex].status = status

  res.json({
    success: true,
    message: 'Session updated successfully',
    data: interviewSessions[sessionIndex]
  })
})

// DELETE session
app.delete('/api/sessions/:id', (req, res) => {
  const id = parseInt(req.params.id)
  const sessionIndex = interviewSessions.findIndex(s => s.id === id)

  if (sessionIndex === -1) {
    return res.status(404).json({
      success: false,
      message: `Session with id ${id} not found`
    })
  }

  interviewSessions.splice(sessionIndex, 1)

  res.json({
    success: true,
    message: 'Session deleted successfully'
  })
})

// Handle unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} does not exist`
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📋 Available routes:`)
  console.log(`   GET    /health`)
  console.log(`   GET    /api/sessions`)
  console.log(`   GET    /api/sessions/:id`)
  console.log(`   POST   /api/sessions`)
  console.log(`   PUT    /api/sessions/:id`)
  console.log(`   DELETE /api/sessions/:id`)
})