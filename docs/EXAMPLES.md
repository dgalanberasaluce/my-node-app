
# Examples for running the API locally

This document explains how to run and test the sample API either with built-in mocks (no Docker) or using real services via `docker compose`.

Prerequisites

- Node.js and pnpm installed.
- (Optional) `curl` and `jq` for command-line examples.
- (Optional for real services) `docker` and `docker compose`.

1) Run with mocks (recommended for development)

- Copy the example env file and start the app in mock mode:

```bash
cp .env.example .env
pnpm install
pnpm run start:mock
```

- Useful endpoints:
  - Register: `POST /auth/register` → body `{ "name","email","password" }` — returns `{ user, token }`
  - Login:    `POST /auth/login`    → body `{ "email","password" }` — returns `{ user, token }`
  - Public:   `GET /example/public`
  - Protected:`GET /example/protected` (requires `Authorization: Bearer <token>`)
  - Cache:    `POST /example/cache` (body `{ key, value, ttl? }`) and `GET /example/cache/:key`
  - Items:    CRUD on `/example/items` — demo uses in-memory SQLite
  - Broker:   `POST /example/publish` (body `{ topic?, exchange?, routingKey?, payload }`)
  - Inspect:  `GET /example/messages/:topic` — only available with the mock broker

- Quick example (register → use token):

```bash
# Register and extract token (requires jq)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"Secret123!"}' \
  | jq -r '.token')

# Call protected endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/protected

# Save to cache
curl -s -X POST http://localhost:3000/example/cache \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"hello","value":"world","ttl":120}'

# Read cache
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/cache/hello

# Create item in SQLite (in-memory)
curl -s -X POST http://localhost:3000/example/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My item","value":"42","meta":{"tag":"demo"}}'

# List items
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/items

# Publish message (mock broker stores it in memory)
curl -s -X POST http://localhost:3000/example/publish \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"payload":{"event":"user.created","id":"123"}}'

# Inspect published messages (mock only)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/messages/example.events
```

Notes:
- With `USE_MOCKS=true` external services (Redis, broker, DB when in-memory) run inside the process. This is the fastest way to develop and test.
- The JWT returned by `/auth/register` and `/auth/login` uses the `Authorization: Bearer <token>` format.

2) Run with real services (docker-compose)

- Copy `.env.example`, adjust values if needed, and bring up the services:

```bash
cp .env.example .env
# Optionally edit .env and set USE_MOCKS=false and BROKER_TYPE=rabbitmq (or kafka)
pnpm run compose:up
pnpm install
# Run the app against the running services
USE_MOCKS=false BROKER_TYPE=rabbitmq REDIS_URL=redis://localhost:6379 \
  RABBITMQ_URL=amqp://guest:guest@localhost:5672 pnpm run start:real
```

- Verify services:
  - Redis: `redis-cli -h localhost -p 6379 ping` → `PONG`
  - RabbitMQ UI: open http://localhost:15672 (user `guest` / `guest`)
  - Kafka: `localhost:9092` (may require external tools for inspection)

- Use the API the same way as in the previous section (get a token and call protected endpoints).

- Stop and clean up:

```bash
pnpm run compose:down
```

3) Persisting SQLite to a file

If you want SQLite to persist between restarts, set in `.env`:

```
DB_FILE=./data/app.db
```

Then start the app (with mocks or `USE_MOCKS=false` as you prefer). The `data/app.db` file will be created automatically.

4) Troubleshooting

- If `better-sqlite3` fails to build on your machine (native build), switch to `DB_FILE=:memory:` and use mocks; the app will work for most demos without the native binary.
- On macOS/Apple Silicon, if you encounter build failures, install build tools (`python`, `make`, `gcc`) and allow build scripts during `pnpm` install.
- For debugging messages and cache, use the inspection endpoints (`/example/messages/:topic`, `/example/cache/:key`) when running with `USE_MOCKS=true`.

5) Resources

- Example env file: `.env.example`
- Compose for real services: `docker-compose.yml`
- Example routes: `/example/*` (see `src/routes/example.routes.js`)

## Swagger UI (OpenAPI documentation)

The application exposes Swagger UI at `/docs` and the raw spec at `/docs/spec.json`.

Manual check:

```bash
# Start the app with mocks
USE_MOCKS=true pnpm run start:mock

# Open in browser: http://localhost:3000/docs

# Or fetch the spec JSON
curl http://localhost:3000/docs/spec.json | jq .openapi
```

Automated test:

1. Install dev dependencies if needed:
```bash
pnpm install
```
2. Run tests (integration test starts the app in-memory with mocks):
```bash
pnpm test
```

The test verifies that `/docs` returns HTML and that `/docs/spec.json` contains the `openapi` property.

---

If you want, I can add more compact `curl` snippets or create `Makefile`/npm scripts to automate these steps.
