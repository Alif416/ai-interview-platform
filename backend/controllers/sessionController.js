const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { prisma } = require('../config/database')

// GET /api/v1/sessions
const getAllSessions = asyncHandler(async (req, res) => {
  const { status, role } = req.query

  const sessions = await prisma.interviewSession.findMany({
    where: {
      ...(status && { status: status.toUpperCase() }),
      ...(role && { role: { contains: role, mode: 'insensitive' } })
    },
    include: {
      interviewer: { select: { id: true, name: true, email: true } },
      candidate: { select: { id: true, name: true, email: true } }
    },
    orderBy: { scheduledAt: 'asc' }
  })

  ApiResponse.success(res, {
    sessions,
    count: sessions.length
  }, 'Sessions retrieved successfully')
})

// GET /api/v1/sessions/:id
const getSessionById = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return ApiResponse.badRequest(res, 'Session ID must be a number')
  }

  const session = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      interviewer: { select: { id: true, name: true, email: true } },
      candidate: { select: { id: true, name: true, email: true } }
    }
  })

  if (!session) {
    return ApiResponse.notFound(res, `Session with id ${id} not found`)
  }

  ApiResponse.success(res, session, 'Session retrieved successfully')
})

// POST /api/v1/sessions
const createSession = asyncHandler(async (req, res) => {
  const { title, role, level, scheduledAt, interviewerId, candidateId } = req.body

  // Validation
  const errors = []
  if (!title) errors.push('title is required')
  if (!role) errors.push('role is required')
  if (!level) errors.push('level is required')
  if (!scheduledAt) errors.push('scheduledAt is required')
  if (!interviewerId) errors.push('interviewerId is required')
  if (!candidateId) errors.push('candidateId is required')

  if (errors.length > 0) {
    return ApiResponse.badRequest(res, 'Validation failed', errors)
  }

  // Check users exist
  const [interviewer, candidate] = await Promise.all([
    prisma.user.findUnique({ where: { id: interviewerId } }),
    prisma.user.findUnique({ where: { id: candidateId } })
  ])

  if (!interviewer) return ApiResponse.notFound(res, 'Interviewer not found')
  if (!candidate) return ApiResponse.notFound(res, 'Candidate not found')

  const session = await prisma.interviewSession.create({
    data: {
      title,
      role,
      level,
      scheduledAt: new Date(scheduledAt),
      interviewerId,
      candidateId
    },
    include: {
      interviewer: { select: { id: true, name: true, email: true } },
      candidate: { select: { id: true, name: true, email: true } }
    }
  })

  ApiResponse.created(res, session, 'Session created successfully')
})

// PUT /api/v1/sessions/:id
const updateSession = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  const { status } = req.body

  const validStatuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

  if (!status || !validStatuses.includes(status.toUpperCase())) {
    return ApiResponse.badRequest(
      res,
      `Status must be one of: ${validStatuses.join(', ')}`
    )
  }

  const session = await prisma.interviewSession.update({
    where: { id },
    data: { status: status.toUpperCase() },
    include: {
      interviewer: { select: { id: true, name: true, email: true } },
      candidate: { select: { id: true, name: true, email: true } }
    }
  })

  ApiResponse.success(res, session, 'Session updated successfully')
})

// DELETE /api/v1/sessions/:id
const deleteSession = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)

  await prisma.interviewSession.delete({
    where: { id }
  })

  ApiResponse.success(res, null, 'Session deleted successfully')
})

module.exports = {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession
}