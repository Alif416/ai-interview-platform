/**
 * Cache Service
 * Abstraction layer for Redis caching with OOP principles
 * Handles TTL-based caching, patterns, and graceful error handling
 */
class CacheService {
  constructor(redis, logger) {
    this.redis = redis
    this.logger = logger.child('CacheService')

    // TTLs in seconds
    this.TTL = {
      SHORT: 60 * 5,           // 5 minutes
      MEDIUM: 60 * 30,         // 30 minutes
      LONG: 60 * 60,           // 1 hour
      VERY_LONG: 60 * 60 * 24, // 24 hours
      QUESTIONS: 7 * 24 * 60 * 60,    // 7 days
      PROBLEM: 24 * 60 * 60,          // 24 hours
      PROBLEMS_LIST: 60 * 60          // 1 hour
    }
  }

  async get(key) {
    try {
      if (!this.redis) return null
      const value = await this.redis.get(key)
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`)
        return JSON.parse(value)
      }
      return null
    } catch (error) {
      this.logger.warn(`Cache GET error for key ${key}`, error)
      return null
    }
  }

  async set(key, value, ttl = this.TTL.MEDIUM) {
    try {
      if (!this.redis) return
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl)
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      this.logger.warn(`Cache SET error for key ${key}`, error)
    }
  }

  async delete(key) {
    try {
      if (!this.redis) return
      await this.redis.del(key)
      this.logger.debug(`Cache DELETE: ${key}`)
    } catch (error) {
      this.logger.warn(`Cache DELETE error for key ${key}`, error)
    }
  }

  async deleteMany(keys) {
    try {
      if (!this.redis || keys.length === 0) return
      await this.redis.del(...keys)
      this.logger.debug(`Cache DELETE MANY: ${keys.length} keys`)
    } catch (error) {
      this.logger.warn(`Cache DELETE MANY error`, error)
    }
  }

  async deleteByPattern(pattern) {
    try {
      if (!this.redis) return
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        this.logger.debug(`Cache DELETE PATTERN: ${pattern} (${keys.length} keys)`)
      }
    } catch (error) {
      this.logger.warn(`Cache DELETE PATTERN error for ${pattern}`, error)
    }
  }

  async clear() {
    try {
      if (!this.redis) return
      await this.redis.flushdb()
      this.logger.warn('Cache cleared - FLUSHDB executed')
    } catch (error) {
      this.logger.error('Cache FLUSHDB error', error)
    }
  }

  async remember(key, ttl, callback) {
    try {
      const cached = await this.get(key)
      if (cached) return cached

      const value = await callback()
      await this.set(key, value, ttl)
      return value
    } catch (error) {
      this.logger.warn(`Cache remember error for key ${key}`, error)
      return await callback()
    }
  }

  async has(key) {
    try {
      if (!this.redis) return false
      const exists = await this.redis.exists(key)
      return exists === 1
    } catch (error) {
      this.logger.warn(`Cache EXISTS check error for key ${key}`, error)
      return false
    }
  }

  async increment(key, amount = 1, ttl = this.TTL.MEDIUM) {
    try {
      if (!this.redis) return null
      const result = await this.redis.incrby(key, amount)
      await this.redis.expire(key, ttl)
      return result
    } catch (error) {
      this.logger.warn(`Cache INCREMENT error for key ${key}`, error)
      return null
    }
  }

  async getStats() {
    try {
      if (!this.redis) return null
      const info = await this.redis.info('stats')
      return info
    } catch (error) {
      this.logger.warn('Failed to get cache stats', error)
      return null
    }
  }

  // Backwards compatibility - static methods that use lazy-loaded redis
  static TTL = {
    QUESTIONS: 7 * 24 * 60 * 60,
    PROBLEM: 24 * 60 * 60,
    PROBLEMS_LIST: 60 * 60,
  }
}

// Export for backwards compatibility with functional approach
module.exports = CacheService

// Keep old function-based exports for gradual migration
const { getRedis } = require('../config/redis')

const legacyGet = async (key) => {
  const redis = getRedis()
  if (!redis) return null
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

const legacySet = async (key, value, ttl) => {
  const redis = getRedis()
  if (!redis) return
  await redis.set(key, JSON.stringify(value), 'EX', ttl)
}

const legacyDel = async (key) => {
  const redis = getRedis()
  if (!redis) return
  await redis.del(key)
}

const legacyDelByPattern = async (pattern) => {
  const redis = getRedis()
  if (!redis) return
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}

// Export both class and legacy functions for backwards compatibility
module.exports = CacheService
module.exports.get = legacyGet
module.exports.set = legacySet
module.exports.del = legacyDel
module.exports.delByPattern = legacyDelByPattern
module.exports.TTL = CacheService.TTL
