const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

// Prisma 7 requires an adapter for direct DB connections
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Single instance across entire app
// Creating multiple instances causes connection issues
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn']
})

// Test connection on startup
const connectDB = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1) // Crash the server — can't run without DB
  }
}

module.exports = { prisma, connectDB }