import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';
import { applications, fields, courses, auth } from './routes';
import { limitBodySize } from './middleware/limitBodySize'
import { HTTPException } from 'hono/http-exception';
import { rateLimit } from './middleware/rateLimit'
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

// Ensure JWT secret is set in production; warn in development
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET must be set in production environment')
    process.exit(1)
  } else {
    console.warn('JWT_SECRET is not set. Protected routes will reject requests if used.');
  }
}

const app = new Hono().basePath('/api');

// Limit request body size to 100 KiB by default to mitigate large payloads
app.use(limitBodySize(1024 * 100), logger(), secureHeaders(), prettyJSON(), cors());

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
    console.error('Internal server error: ', err);

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