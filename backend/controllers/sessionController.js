const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { prisma } = require('../config/database')

const SESSION_SELECT = {
  id: true, title: true, role: true, level: true,
  status: true, scheduledAt: true, createdAt: true,
  interviewer: { select: { id: true, name: true, username: true, email: true } },
  candidate:   { select: { id: true, name: true, username: true, email: true } },
}

// GET /api/v1/sessions
// Interviewers/Admins see sessions they created.
// Candidates see only sessions they were invited to.
const getAllSessions = asyncHandler(async (req, res) => {
  const { status, role } = req.query
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))

  const userFilter =
    req.user.role === 'CANDIDATE'
      ? { candidateId: req.user.id }
      : req.user.role === 'INTERVIEWER'
        ? { interviewerId: req.user.id }
        : {} // ADMIN sees all

  const where = {
    ...userFilter,
    ...(status && { status: status.toUpperCase() }),
    ...(role && { role: { contains: role, mode: 'insensitive' } }),
  }

  const [total, sessions] = await Promise.all([
    prisma.interviewSession.count({ where }),
    prisma.interviewSession.findMany({
      where,
      select: SESSION_SELECT,
      orderBy: { scheduledAt: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  ApiResponse.success(res, {
    sessions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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
    select: SESSION_SELECT,
  })

  if (!session) {
    return ApiResponse.notFound(res, `Session with id ${id} not found`)
  }

  // Only the interviewer, the candidate, or an admin can view it
  const isAllowed =
    req.user.role === 'ADMIN' ||
    session.interviewer.id === req.user.id ||
    session.candidate.id  === req.user.id

  if (!isAllowed) {
    return ApiResponse.error(res, 'You do not have access to this session', 403)
  }

  ApiResponse.success(res, session, 'Session retrieved successfully')
})

// POST /api/v1/sessions
// Interviewer invites a candidate by username. interviewerId comes from req.user.
const createSession = asyncHandler(async (req, res) => {
  const { title, role, level, scheduledAt, candidateUsername } = req.body

  const candidate = await prisma.user.findUnique({
    where: { username: candidateUsername },
    select: { id: true, role: true, name: true },
  })

  if (!candidate) {
    return ApiResponse.notFound(res, `No user found with username "${candidateUsername}"`)
  }

  if (candidate.role !== 'CANDIDATE') {
    return ApiResponse.badRequest(res, 'The invited user is not a candidate')
  }

  const session = await prisma.interviewSession.create({
    data: {
      title,
      role,
      level,
      scheduledAt: new Date(scheduledAt),
      interviewerId: req.user.id,
      candidateId:   candidate.id,
    },
    select: SESSION_SELECT,
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

  // Only the session's interviewer or admin can change status
  const existing = await prisma.interviewSession.findUnique({
    where: { id },
    select: { interviewerId: true },
  })

  if (!existing) return ApiResponse.notFound(res, `Session with id ${id} not found`)

  if (req.user.role !== 'ADMIN' && existing.interviewerId !== req.user.id) {
    return ApiResponse.error(res, 'You are not the interviewer of this session', 403)
  }

  const session = await prisma.interviewSession.update({
    where: { id },
    data: { status: status.toUpperCase() },
    select: SESSION_SELECT,
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
