
## my-node-app

Lightweight Express API, modular and configured for `pnpm`.

Requirements
- Node.js 18+ (or compatible)
- pnpm

Installation
```bash
pnpm install
```

Scripts
- `pnpm dev` — starts the app in watch mode
- `pnpm start` — starts the app with Node

Running locally
```bash
pnpm dev
# or
pnpm start
```

Endpoints
- `GET /health` — returns service status and timestamp
- `GET /api/hello` — simple greeting (JWT protected)
- `POST /api/echo` — returns the JSON body (JWT protected)

Auth & Users API
- `POST /auth/register` — creates a user and returns a token
	- body: `{ "name": "Ada", "email": "ada@example.com", "password": "secret123" }`
- `POST /auth/login` — authenticates a user and returns a token
	- body: `{ "email": "ada@example.com", "password": "secret123" }`
- `POST /auth/logout` — revokes the current token (requires `Authorization: Bearer <token>`)
- `GET /auth/me` — returns the authenticated user (requires token)
- `GET /users` — list users (requires token)
- `GET /users/:id` — get user by id (requires token)
- `PATCH /users/:id` — update `name`, `email` and/or `password` (requires token)
- `DELETE /users/:id` — delete a user (requires token)

Security notes
- Passwords are hashed using `bcryptjs` and never returned by endpoints.
- JWT tokens include `jti` and are validated for `issuer`/`audience`.
- Token revocation (logout) uses Redis (`REDIS_URL`) with TTL in production and an in-memory list in development.
- The app includes hardening: `helmet`, configurable CORS`, `express-rate-limit` on auth endpoints and request size limits.

See `docs/SECURITY.md` for deployment and hardening guidance.

Quick usage (curl)
```bash
# 1) Register
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
	-H "Content-Type: application/json" \
	-d '{"name":"Ada","email":"ada@example.com","password":"secret123"}')

TOKEN=$(echo "$REGISTER_RESPONSE" | node -p "const fs=require('fs'); JSON.parse(fs.readFileSync(0,'utf8')).token")

# 2) Authenticated /auth/me
curl -s http://localhost:3000/auth/me -H "Authorization: Bearer $TOKEN"

# 3) List users
curl -s http://localhost:3000/users -H "Authorization: Bearer $TOKEN"

# 4) Logout (token gets revoked)
curl -s -X POST http://localhost:3000/auth/logout -H "Authorization: Bearer $TOKEN"
```

Project structure (summary)
- `src/index.js` — entry point (starts the server)
- `src/app.js` — Express app factory (configures middlewares and routes)
- `src/config/` — centralized configuration
- `src/controllers/` — route handlers
- `src/routes/` — router definitions and aggregation
- `src/middlewares/` — shared middlewares (e.g. error handler)

Contributing
- Stage changes and commit with a descriptive message, e.g.:

```bash
git add .
git commit -m "feat: add example"
```

License
- MIT

Logging
-------

This project uses structured logging with `winston` and propagates a `correlationId`
per request using `AsyncLocalStorage`.

Key points

- Correlation ID: if the client sends `X-Correlation-Id` it will be reused; otherwise the service generates a UUID per request and returns it as `X-Correlation-Id`.
- Format: in `production` logs are emitted as JSON (compatible with log collectors). In development logs are colorized for readability.
- Fixed metadata: each entry includes `service`, `version` and `environment`.
- Levels: `http` for 2xx, `warn` for 4xx, `error` for 5xx. `LOG_LEVEL` is configurable via env var.

Environment variables

- `NODE_ENV` — `development`/`production`
- `LOG_LEVEL` — minimum log level (`debug`, `info`, `warn`, `error`, ...)

Examples

1) Logging from a controller:

```javascript
const { logger } = require('../logger');

function createUser(req, res) {
	const { username } = req.body;
	logger.info('creating user', { username });
	// ... logic
	res.status(201).json({ ok: true });
}
```

2) Include extra metadata and errors:

```javascript
try {
	// operation that may fail
} catch (err) {
	logger.error('failed to do operation', { error: err.message, stack: err.stack });
	throw err;
}
```

3) Obtain the `correlationId` from anywhere in the stack (for logs or payloads):

```javascript
const { requestContext } = require('../logger');
const store = requestContext.getStore();
const correlationId = store && store.correlationId;
```

Example log (production JSON):

```json
{
	"timestamp": "2026-03-04T08:07:05.182Z",
	"level": "info",
	"message": "request completed",
	"correlationId": "ef79198e-e9f7-4f6f-b74e-24ed324e0f2e",
	"method": "GET",
	"path": "/health",
	"statusCode": 200,
	"durationMs": 5.31,
	"service": "my-node-app",
	"version": "1.0.0",
	"environment": "development"
}
```

Production recommendations

- Send logs to a collector (Datadog, Loki, ELK, CloudWatch). JSON logs in `production` are easily ingested by those systems.
- Set `LOG_LEVEL=info` or `warn` in production to reduce noise.
- Ensure upstream services preserve and forward `X-Correlation-Id` for full distributed tracing.

