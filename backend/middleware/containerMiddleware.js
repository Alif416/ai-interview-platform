/**
 * Container Middleware
 * Injects the service container into each request
 * Makes services available via req.container
 */

function containerMiddleware(container) {
  return (req, res, next) => {
    req.container = {
      // Services
      authService: container.resolve('services.auth'),
      aiService: container.resolve('services.ai'),
      cacheService: container.resolve('services.cache'),
      emailService: container.resolve('services.email'),

      // Repositories
      userRepository: container.resolve('repositories.user'),
      sessionRepository: container.resolve('repositories.session'),
      problemRepository: container.resolve('repositories.problem'),
      performanceRepository: container.resolve('repositories.performance'),

      // Core services
      logger: container.resolve('logger'),
      config: container.resolve('config'),
    }

    next()
  }
}

module.exports = containerMiddleware
