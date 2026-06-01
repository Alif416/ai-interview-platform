require('dotenv').config()

const { Pool } = require('pg')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

// PrismaPg requires a pg.Pool instance, not a plain config object
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

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