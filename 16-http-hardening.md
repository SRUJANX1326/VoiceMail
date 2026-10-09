# HTTP hardening

**Scoring area:** Security (96/100)

## What graders look for
Security headers, rate limiting, CORS policy, HTTPS.

## Where your project stands
The Express app has no `helmet`, no rate limiter, and no explicit CORS policy (same-origin serving makes CORS safe by default). Nothing throttles `/api/send` or the LLM endpoints.

## Gap
A reviewer can easily see the missing headers (CSP, X-Content-Type-Options, frame protection) and the absence of rate limits on costly endpoints.

## What to do
1. `npm i helmet express-rate-limit`; use `app.use(helmet())` and a limiter on `/api/*` (for example 60 per minute) with a tighter one on `/api/send` and `/api/drive/upload`.
2. Add `app.disable('x-powered-by')`.
3. Set `trust proxy` correctly when deployed on Render.
