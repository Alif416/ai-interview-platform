/**
 * Service Container (IoC Container)
 * Manages dependency injection and service registration
 * Implements singleton pattern for services
 */
class ServiceContainer {
  constructor() {
    this.services = new Map()
    this.singletons = new Map()
  }

  /**
   * Register a service factory
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service
   */
  register(name, factory) {
    if (typeof factory !== 'function') {
      throw new Error(`Service factory for "${name}" must be a function`)
    }
    this.services.set(name, { factory, isSingleton: false })
  }

  /**
   * Register a singleton service (one instance per container)
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that creates the service
   */
  singleton(name, factory) {
    if (typeof factory !== 'function') {
      throw new Error(`Service factory for "${name}" must be a function`)
    }
    this.services.set(name, { factory, isSingleton: true })
  }

  /**
   * Resolve a service from the container
   * @param {string} name - Service name
   * @returns {*} - The service instance
   */
  resolve(name) {
    const serviceConfig = this.services.get(name)

    if (!serviceConfig) {
      throw new Error(`Service "${name}" not found in container`)
    }

    const { factory, isSingleton } = serviceConfig

    if (isSingleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, factory(this))
      }
      return this.singletons.get(name)
    }

    return factory(this)
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name)
  }

  /**
   * Clear all services and singletons (useful for testing)
   */
  clear() {
    this.services.clear()
    this.singletons.clear()
  }
}

module.exports = ServiceContainer
