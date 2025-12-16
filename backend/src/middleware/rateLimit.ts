import { StatusCodes } from 'http-status-codes'

type Entry = { count: number; reset: number }

export function rateLimit(opts?: { windowMs?: number; max?: number }) {
  const windowMs = opts?.windowMs ?? 60_000
  const max = opts?.max ?? 60

  // Simple in-memory store. For production, replace with Redis.
  const store = new Map<string, Entry>()

  return async (c: any, next: any) => {
    try {
      // Determine client IP (best-effort)
      const ip =
        c.req.headers.get('x-forwarded-for') ||
        c.req.headers.get('x-real-ip') ||
        c.req.headers.get('cf-connecting-ip') ||
        'unknown'

      const now = Date.now()
      const entry = store.get(ip)

      if (!entry || now > entry.reset) {
        store.set(ip, { count: 1, reset: now + windowMs })
      } else {
        entry.count += 1
        if (entry.count > max) {
          const retryAfter = Math.ceil((entry.reset - now) / 1000)
          const headers = { 'Retry-After': String(retryAfter) }
          return c.json({ message: 'Too many requests' }, StatusCodes.TOO_MANY_REQUESTS, headers)
        }
      }

      return next()
    } catch (err) {
      return c.json({ message: 'Rate limit error' }, StatusCodes.INTERNAL_SERVER_ERROR)
    }
  }
}
