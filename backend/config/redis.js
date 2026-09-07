require('dotenv').config()

const Redis = require('ioredis')
const config = require('./config')

let redis = null

const connectRedis = async () => {
  try {
    redis = new Redis(config.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    redis.on('connect', () => console.log('✅ Redis connected successfully'))
    redis.on('error', (err) => console.error('❌ Redis error:', err.message))

    await redis.connect()
    return redis
  } catch (error) {
    console.error('⚠️ Redis unavailable; using in-memory fallbacks:', error.message)
    if (redis) redis.disconnect()
    redis = null
    return null
  }
}

const disconnectRedis = async () => {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

const getRedis = () => redis

module.exports = { connectRedis, disconnectRedis, getRedis }
