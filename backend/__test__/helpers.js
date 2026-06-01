const bcrypt = require('bcrypt')
const { prisma } = require('../config/database')
const { generateToken } = require('../utils/jwt')

// Creates a test user and returns user + token
const createTestUser = async (overrides = {}) => {
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.user.create({
    data: {
      name: overrides.name || 'Test User',
      email: overrides.email || 'test@example.com',
      password: hashedPassword,
      role: overrides.role || 'CANDIDATE'
    }
  })

  const token = generateToken({ userId: user.id, role: user.role })

  return { user, token }
}

// Creates a test interviewer
const createTestInterviewer = async () => {
  return createTestUser({
    name: 'Test Interviewer',
    email: 'interviewer@example.com',
    role: 'INTERVIEWER'
  })
}

// Creates a test session
const createTestSession = async (interviewerId, candidateId) => {
  return prisma.interviewSession.create({
    data: {
      title: 'Test Interview',
      role: 'Software Engineer',
      level: 'L3',
      status: 'SCHEDULED',
      scheduledAt: new Date('2024-12-01T10:00:00Z'),
      interviewerId,
      candidateId
    }
  })
}

module.exports = { createTestUser, createTestInterviewer, createTestSession }