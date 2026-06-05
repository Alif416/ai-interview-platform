const { getRedis } = require('../config/redis')

// TTLs in seconds
const TTL = {
  QUESTIONS: 7 * 24 * 60 * 60, // 7 days — same params yield same questions
  PROBLEM:   24 * 60 * 60,      // 24 hours — rarely updated
  PROBLEMS_LIST: 60 * 60,       // 1 hour — list/filters change more often
}

const get = async (key) => {
  const redis = getRedis()
  if (!redis) return null
  const value = await redis.get(key)
  return value ? JSON.parse(value) : null
}

const set = async (key, value, ttl) => {
  const redis = getRedis()
  if (!redis) return
  await redis.set(key, JSON.stringify(value), 'EX', ttl)
}

const del = async (key) => {
  const redis = getRedis()
  if (!redis) return
  await redis.del(key)
}

// Delete all keys matching a pattern (e.g. "problems:*")
const delByPattern = async (pattern) => {
  const redis = getRedis()
  if (!redis) return
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}

module.exports = { get, set, del, delByPattern, TTL }
