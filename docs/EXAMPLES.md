# Ejemplos para ejecutar la API localmente

Este documento explica cómo probar la API de ejemplo tanto con mocks (sin Docker) como usando servicios reales mediante `docker compose`.

Requisitos previos

- Node.js y pnpm instalados.
- (Opcional) `curl` y `jq` para ejecutar ejemplos en la terminal.
- (Opcional para servicios reales) `docker` y `docker compose`.

1) Ejecutar con mocks (recomendado para desarrollo)

- Copia el archivo de ejemplo de entorno y arranca la app en modo `mock`:

```bash
cp .env.example .env
pnpm install
pnpm run start:mock
```

- Endpoints útiles:
  - Registro: `POST /auth/register` → body `{ "name","email","password" }` — devuelve `{ user, token }`
  - Login:    `POST /auth/login`    → body `{ "email","password" }` — devuelve `{ user, token }`
  - Public:   `GET /example/public`
  - Protected:`GET /example/protected` (requiere `Authorization: Bearer <token>`)
  - Cache:    `POST /example/cache` (body `{ key, value, ttl? }`) y `GET /example/cache/:key`
  - Items:    CRUD en `/example/items` — demo con SQLite en memoria
  - Broker:   `POST /example/publish` (body `{ topic?, exchange?, routingKey?, payload }`)
  - Inspect:  `GET /example/messages/:topic` — sólo disponible con broker mock

- Ejemplo rápido (registro → uso del token):

```bash
# Registrarse y extraer token (requiere jq)
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"Secret123!"}' \
  | jq -r '.token')

# Usar endpoint protegido
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/protected

# Guardar en cache
curl -s -X POST http://localhost:3000/example/cache \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"key":"hello","value":"world","ttl":120}'

# Leer cache
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/cache/hello

# Crear item en SQLite (in-memory)
curl -s -X POST http://localhost:3000/example/items \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My item","value":"42","meta":{"tag":"demo"}}'

# Listar items
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/items

# Publicar mensaje (mock broker lo almacenará en memoria)
curl -s -X POST http://localhost:3000/example/publish \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"payload":{"event":"user.created","id":"123"}}'

# Inspeccionar mensajes publicados (solo mock)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/example/messages/example.events
```

Notas:
- Con `USE_MOCKS=true` los servicios externos (Redis, broker, DB si está en memoria) corren en proceso. Es la forma más rápida para desarrollar y testear.
- El token JWT devuelto por `/auth/register` y `/auth/login` tiene el formato `Authorization: Bearer <token>`.

2) Ejecutar con servicios reales (docker-compose)

- Copia el `.env.example`, ajusta valores si lo deseas y levanta los servicios:

```bash
cp .env.example .env
# Opcional: editar .env y poner USE_MOCKS=false y BROKER_TYPE=rabbitmq (o kafka)
pnpm run compose:up
pnpm install
# Ejecutar la app contra los servicios levantados
USE_MOCKS=false BROKER_TYPE=rabbitmq REDIS_URL=redis://localhost:6379 \ 
  RABBITMQ_URL=amqp://guest:guest@localhost:5672 pnpm run start:real
```

- Comprobar servicios:
  - Redis: `redis-cli -h localhost -p 6379 ping` → `PONG`
  - RabbitMQ UI: abrir http://localhost:15672 (usuario `guest` / `guest`)
  - Kafka: `localhost:9092` (puede requerir herramientas externas para inspección)

- Usar la API igual que en la sección anterior (obtener token y llamar endpoints protegidos).

- Parar y limpiar:

```bash
pnpm run compose:down
```

3) Persistencia SQLite en archivo

Si deseas que la base de datos SQLite persista entre reinicios, pon en `.env`:

```
DB_FILE=./data/app.db
```

y luego arranca la app (con mocks o con `USE_MOCKS=false` según prefieras). El archivo `data/app.db` se creará automáticamente.

4) Notas y solución de problemas

- Si `better-sqlite3` no compila en tu máquina (native build), puedes cambiar a `DB_FILE=:memory:` y usar mocks; la app funcionará sin el binario nativo para la mayoría de demos.
- Si usas macOS con Apple Silicon y ves fallos de compilación, instala las herramientas de build (`python`, `make`, `gcc`) y acepta la ejecución de scripts de compilación en `pnpm` si se solicita.
- Para depuración de mensajes y cache, usa los endpoints de inspección (`/example/messages/:topic`, `/example/cache/:key`) cuando estés con `USE_MOCKS=true`.

5) Recursos

- Archivo de configuración de ejemplo: `.env.example`
- Compose para servicios reales: `docker-compose.yml`
- Rutas de ejemplo: `/example/*` (ver `src/routes/example.routes.js`)

## Swagger UI (documentación OpenAPI)

La aplicación expone una interfaz Swagger UI en `/docs` y el spec raw en
`/docs/spec.json`.

Probar manualmente:

```bash
# Levanta la aplicación con mocks
USE_MOCKS=true pnpm run start:mock

# Abrir en el navegador: http://localhost:3000/docs

# O recuperar el spec JSON
curl http://localhost:3000/docs/spec.json | jq .openapi
```

Probar automáticamente (test):

1. Instala dependencias de desarrollo si no están instaladas:
```bash
pnpm install
```
2. Ejecuta los tests (el test de integración arranca la app en memoria con mocks):
```bash
pnpm test
```

El test comprueba que `/docs` responde HTML y que `/docs/spec.json` contiene
la propiedad `openapi`.

---

Si quieres, puedo añadir ejemplos de `curl` más compactos, o crear scripts de `Makefile`/`npm` para automatizar los pasos.
