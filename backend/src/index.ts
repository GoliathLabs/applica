import { Hono } from 'hono';
// removed hono logger import to avoid name collision with app logger
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { applications, fields, courses, auth } from './routes';
import { limitBodySize } from './middleware/limitBodySize'
import { requestIdMiddleware } from './middleware/requestId'
import { HTTPException } from 'hono/http-exception';
import { rateLimit } from './middleware/rateLimit'
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

// Ensure JWT secret is set in production; warn in development
const JWT_SECRET = process.env.JWT_SECRET
import { logger as appLogger } from './common/logger'

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    appLogger.error('JWT_SECRET must be set in production environment')
    process.exit(1)
  } else {
    appLogger.warn('JWT_SECRET is not set. Protected routes will reject requests if used.');
  }
}

const app = new Hono().basePath('/api');

// Limit request body size to 100 KiB by default to mitigate large payloads
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())

app.use(
  // attach request id early for correlation
  requestIdMiddleware(),
  limitBodySize(1024 * 100),
  // Use structured logger middleware that proxies to console
  async (c, next) => {
    // simple request logging
    appLogger.info('incoming request', { method: c.req.method, url: c.req.url })
    return next()
  },
  secureHeaders(),
  // Add a strict CSP header in production
  async (c, next) => {
    if (process.env.NODE_ENV === 'production') {
      c.header(
        'Content-Security-Policy',
        "default-src 'self'; frame-ancestors 'none'; base-uri 'self'"
      )
    }

    return next()
  },
  prettyJSON(),
  // Restrict allowed origins to configured frontend origin(s)
  cors({
    origin: (origin) => {
      // allow no-origin requests (e.g., curl/server-to-server) but check browser origins
      if (!origin) return true
      return FRONTEND_ORIGINS.includes(origin)
    },
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

// Apply rate limiting to the public applications endpoints (e.g., POST /applications)
// Configure: 30 requests per minute per IP by default
// Apply rate limiting to POST on the public applications endpoint: 10 requests/min per IP
app.use('/applications', rateLimit({ windowMs: 60_000, max: 10, methods: ['POST'] }))

app.route('/', applications.app);
app.route('/', fields.app);
app.route('/', courses.app);
app.route('/', auth.app);

app.notFound((c) => c.json({ message: 'Not Found' }, StatusCodes.NOT_FOUND));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  } else {
    appLogger.error('Internal server error', { err: String(err) })

    return c.json(
      { message: ReasonPhrases.INTERNAL_SERVER_ERROR },
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
});

export default {
  port: 8080,
  fetch: app.fetch,
};