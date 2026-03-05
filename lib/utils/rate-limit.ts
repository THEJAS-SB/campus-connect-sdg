/**
 * Simple in-memory rate limiter for API endpoints
 * For production, use Redis or Upstash for distributed rate limiting
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Check if request should be rate limited
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns { limited: boolean, remaining: number, resetTime: number }
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  limited: boolean
  remaining: number
  resetTime: number
}> {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  let record = rateLimitStore.get(key)

  // Create new record if doesn't exist or expired
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.interval,
    }
    rateLimitStore.set(key, record)
  }

  // Increment count
  record.count++

  const limited = record.count > config.maxRequests
  const remaining = Math.max(0, config.maxRequests - record.count)

  return {
    limited,
    remaining,
    resetTime: record.resetTime,
  }
}

/**
 * Predefined rate limit configs for different endpoint types
 */
export const RATE_LIMITS = {
  // AI endpoints (expensive)
  AI_GROQ_MATCHMAKING: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  AI_GROQ_MISSIONS: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute
  },
  AI_GROQ_INSIGHTS: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 requests per minute
  },
  AI_EMBEDDINGS: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute
  },

  // Regular API endpoints
  API_MUTATIONS: {
    interval: 10 * 1000, // 10 seconds
    maxRequests: 30, // 30 requests per 10 seconds
  },
  API_QUERIES: {
    interval: 10 * 1000, // 10 seconds
    maxRequests: 100, // 100 requests per 10 seconds
  },
}

/**
 * Rate limit middleware helper for Server Actions
 * Usage:
 * ```ts
 * export async function myAction() {
 *   const userId = await requireUser()
 *   const rateLimitCheck = await checkRateLimit(userId, RATE_LIMITS.AI_GROQ_MISSIONS)
 *   if (rateLimitCheck.limited) {
 *     throw new Error('Rate limit exceeded. Please try again later.')
 *   }
 *   // ... rest of action
 * }
 * ```
 */
export async function requireRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<void> {
  const check = await checkRateLimit(identifier, config)
  if (check.limited) {
    const resetIn = Math.ceil((check.resetTime - Date.now()) / 1000)
    throw new Error(
      `Rate limit exceeded. Try again in ${resetIn} seconds. (Limit: ${config.maxRequests} requests per ${config.interval / 1000}s)`
    )
  }
}
