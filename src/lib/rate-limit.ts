/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, use Upstash Redis or similar.
 * This works for single-instance Vercel serverless (per-invocation memory).
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  })
}, 60000)

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number
}

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const existing = rateLimitMap.get(key)

  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (existing.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: existing.resetTime - now,
    }
  }

  existing.count++
  return {
    success: true,
    remaining: maxRequests - existing.count,
    resetIn: existing.resetTime - now,
  }
}
