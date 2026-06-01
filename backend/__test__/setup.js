const { prisma } = require('../config/database')

// Runs once before ALL tests
beforeAll(async () => {
  await prisma.$connect()
  await prisma.interviewSession.deleteMany()
  await prisma.user.deleteMany()
  console.log('🔌 Test database connected')
})

// Runs after EACH test — clean database
afterEach(async () => {
  // Delete in correct order (relations first)
  await prisma.interviewSession.deleteMany()
  await prisma.user.deleteMany()
})

// Runs once after ALL tests
afterAll(async () => {
  await prisma.$disconnect()
  console.log('🔌 Test database disconnected')
})