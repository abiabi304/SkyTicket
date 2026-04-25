import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache rate limiter instances per window config
const limiters = new Map<string, Ratelimit>()

function getLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}:${windowMs}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      analytics: false,
      prefix: 'skyticket',
    })
    limiters.set(key, limiter)
  }
  return limiter
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

export async function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  try {
    const limiter = getLimiter(maxRequests, windowMs)
    const { success, remaining, reset } = await limiter.limit(identifier)
    return {
      success,
      remaining,
      resetIn: Math.max(0, reset - Date.now()),
    }
  } catch {
    // If Redis is down, allow the request (fail open)
    return { success: true, remaining: maxRequests, resetIn: 0 }
  }
}
