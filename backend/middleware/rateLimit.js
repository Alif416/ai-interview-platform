const { getRedis } = require('../config/redis')
const ApiResponse = require('../utils/apiResponse')

// In-memory fallback when Redis is unavailable
const memStore = new Map()

const memIncr = (key, windowSecs) => {
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowSecs * 1000 })
    return { count: 1, resetAt: now + windowSecs * 1000 }
  }

  entry.count++
  return entry
}

// Fixed-window counter using Redis INCR + EXPIRE.
// Returns { count, resetAt (ms timestamp) }.
const redisIncr = async (key, windowSecs) => {
  const redis = getRedis()
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSecs)
  const ttl = await redis.ttl(key)
  return { count, resetAt: Date.now() + ttl * 1000 }
}

/**
 * createLimiter({ max, windowSecs, keyFn, message })
 *
 * keyFn(req) → string — determines what gets rate-limited (IP, userId, etc.)
 * Falls back to in-memory counters when Redis is unavailable.
 */
const createLimiter = ({ max, windowSecs, keyFn, message }) => {
  return async (req, res, next) => {
    const key = `ratelimit:${keyFn(req)}`

    let count, resetAt
    try {
      if (!getRedis()) throw new Error('Redis unavailable')
      ;({ count, resetAt } = await redisIncr(key, windowSecs))
    } catch {
      ;({ count, resetAt } = memIncr(key, windowSecs))
    }

    res.set('X-RateLimit-Limit', max)
    res.set('X-RateLimit-Remaining', Math.max(0, max - count))
    res.set('X-RateLimit-Reset', Math.ceil(resetAt / 1000))

    if (count > max) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
      res.set('Retry-After', retryAfter)
      return ApiResponse.error(
        res,
        message || 'Too many requests. Please try again later.',
        429
      )
    }

    next()
  }
}

// ── Preset limiters ───────────────────────────────────────────────────────────

// 200 req / 15 min per IP — baseline abuse guard on all routes
const globalLimiter = createLimiter({
  max: 200,
  windowSecs: 15 * 60,
  keyFn: (req) => `global:${req.ip}`,
  message: 'Too many requests from this IP. Please slow down.',
})

// 10 req / 15 min per IP — brute-force guard on login/register
const authLimiter = createLimiter({
  max: 10,
  windowSecs: 15 * 60,
  keyFn: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts. Try again in 15 minutes.',
})

// 30 req / hour per authenticated user — AI calls are expensive
const aiLimiter = createLimiter({
  max: 30,
  windowSecs: 60 * 60,
  keyFn: (req) => `ai:${req.user?.id ?? req.ip}`,
  message: 'AI request limit reached. You can make 30 AI requests per hour.',
})

module.exports = { globalLimiter, authLimiter, aiLimiter, createLimiter }
