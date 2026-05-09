const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')

// Temporary data — we replace this with database in Week 5
let interviewSessions = [
  {
    id: 1,
    candidateName: 'John Doe',
    role: 'Software Engineer',
    level: 'L3',
    status: 'scheduled',
    scheduledAt: '2024-12-01T10:00:00Z',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    candidateName: 'Jane Smith',
    role: 'Senior Engineer',
    level: 'L5',
    status: 'completed',
    scheduledAt: '2024-11-28T14:00:00Z',
    createdAt: new Date().toISOString()
  }
]

// Validation helper
const validateSession = (data) => {
  const errors = []

  if (!data.candidateName || data.candidateName.trim() === '') {
    errors.push('candidateName is required')
  }

  if (!data.role || data.role.trim() === '') {
    errors.push('role is required')
  }

  const validLevels = ['L3', 'L4', 'L5', 'L6', 'L7']
  if (!data.level || !validLevels.includes(data.level)) {
    errors.push(`level must be one of: ${validLevels.join(', ')}`)
  }

  return errors
}

// GET /api/v1/sessions
const getAllSessions = asyncHandler(async (req, res) => {
  // Future: add pagination, filtering, sorting here
  const { status, role } = req.query

  let filtered = [...interviewSessions]

  if (status) {
    filtered = filtered.filter(s => s.status === status)
  }

  if (role) {
    filtered = filtered.filter(s =>
      s.role.toLowerCase().includes(role.toLowerCase())
    )
  }

  ApiResponse.success(res, {
    sessions: filtered,
    count: filtered.length
  }, 'Sessions retrieved successfully')
})

// GET /api/v1/sessions/:id
const getSessionById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return ApiResponse.badRequest(res, 'Session ID must be a number')
  }

  const session = interviewSessions.find(s => s.id === id)

  if (!session) {
    return ApiResponse.notFound(res, `Session with id ${id} not found`)
  }

  ApiResponse.success(res, session, 'Session retrieved successfully')
})

// POST /api/v1/sessions
const createSession = asyncHandler(async (req, res) => {
  const { candidateName, role, level, scheduledAt } = req.body

  // Validate input
  const errors = validateSession({ candidateName, role, level })
  if (errors.length > 0) {
    return ApiResponse.badRequest(res, 'Validation failed', errors)
  }

  const newSession = {
    id: interviewSessions.length + 1,
    candidateName: candidateName.trim(),
    role: role.trim(),
    level,
    status: 'scheduled',
    scheduledAt: scheduledAt || new Date().toISOString(),
    createdAt: new Date().toISOString()
  }

  interviewSessions.push(newSession)

  ApiResponse.created(res, newSession, 'Session created successfully')
})

// PUT /api/v1/sessions/:id
const updateSession = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return ApiResponse.badRequest(res, 'Session ID must be a number')
  }

  const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled']
  const { status } = req.body

  if (!status || !validStatuses.includes(status)) {
    return ApiResponse.badRequest(
      res,
      `Status must be one of: ${validStatuses.join(', ')}`
    )
  }

  const sessionIndex = interviewSessions.findIndex(s => s.id === id)

  if (sessionIndex === -1) {
    return ApiResponse.notFound(res, `Session with id ${id} not found`)
  }

  interviewSessions[sessionIndex] = {
    ...interviewSessions[sessionIndex],
    status,
    updatedAt: new Date().toISOString()
  }

  ApiResponse.success(
    res,
    interviewSessions[sessionIndex],
    'Session updated successfully'
  )
})

// DELETE /api/v1/sessions/:id
const deleteSession = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return ApiResponse.badRequest(res, 'Session ID must be a number')
  }

  const sessionIndex = interviewSessions.findIndex(s => s.id === id)

  if (sessionIndex === -1) {
    return ApiResponse.notFound(res, `Session with id ${id} not found`)
  }

  interviewSessions.splice(sessionIndex, 1)

  ApiResponse.success(res, null, 'Session deleted successfully')
})

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
}