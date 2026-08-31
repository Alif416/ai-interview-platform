/**
 * Service Container Bootstrap
 * Registers all application services into the container
 * Uses raw SQL repositories with pg Pool
 */
const ServiceContainer = require('./ServiceContainer')
const Logger = require('../logger/Logger')
const config = require('../../config/config')
const { connectDB } = require('../../config/database')
const { connectRedis } = require('../../config/redis')

// Import all services
const UserRepository = require('../../repositories/UserRepository')
const SessionRepository = require('../../repositories/SessionRepository')
const ProblemRepository = require('../../repositories/ProblemRepository')
const PerformanceRepository = require('../../repositories/PerformanceRepository')
const AuthService = require('../../services/AuthService')
const EmailService = require('../../services/EmailService')
const CacheService = require('../../services/CacheService')
const AIService = require('../../services/AIService')

async function bootstrapContainer() {
  const container = new ServiceContainer()
  const logger = new Logger('Bootstrap')

  // Register core services (singletons)
  container.singleton('logger', () => new Logger('App'))
  container.singleton('config', () => config)

  // Register database connections
  container.singleton('pool', async () => {
    const pool = await connectDB()
    return pool
  })

  container.singleton('redis', async () => {
    const redis = await connectRedis()
    return redis
  })

  // Register Repositories (singletons - they're stateless)
  // All repositories use the pg Pool for raw SQL queries
  container.singleton('repositories.user', (c) => {
    return new UserRepository(c.resolve('pool'))
  })

  container.singleton('repositories.session', (c) => {
    return new SessionRepository(c.resolve('pool'))
  })

  container.singleton('repositories.problem', (c) => {
    return new ProblemRepository(c.resolve('pool'))
  })

  container.singleton('repositories.performance', (c) => {
    return new PerformanceRepository(c.resolve('pool'))
  })

  // Register Services (singletons)
  container.singleton('services.cache', (c) => {
    return new CacheService(c.resolve('redis'), c.resolve('logger'))
  })

  container.singleton('services.email', (c) => {
    return new EmailService(c.resolve('config'), c.resolve('logger'))
  })

  container.singleton('services.auth', (c) => {
    return new AuthService(
      c.resolve('repositories.user'),
      c.resolve('services.email'),
      c.resolve('config'),
      c.resolve('logger')
    )
  })

  container.singleton('services.ai', (c) => {
    return new AIService(
      c.resolve('config'),
      c.resolve('services.cache'),
      c.resolve('logger')
    )
  })

  logger.success('Service container bootstrapped successfully')
  return container
}

module.exports = { bootstrapContainer }
