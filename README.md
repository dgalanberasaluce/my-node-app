# my-node-app

Pequeña API en Express, modularizada y configurada para usarse con `pnpm`.

Requisitos
- Node.js 18+ (o compatible)
- pnpm

Instalación
```bash
pnpm install
```

Scripts
- `pnpm dev` — inicia con `nodemon` (recarga automática)
- `pnpm start` — inicia con `node`

Ejecutar localmente
```bash
pnpm dev
# o
pnpm start
```

Endpoints
- `GET /health` — devuelve estado y timestamp
- `GET /api/hello` — saludo simple (protegido con JWT)
- `POST /api/echo` — devuelve el JSON recibido en el body (protegido con JWT)

Auth y Users API
- `POST /auth/register` — crea usuario y devuelve token
	- body: `{ "name": "Ada", "email": "ada@example.com", "password": "secret123" }`
- `POST /auth/login` — autentica usuario y devuelve token
	- body: `{ "email": "ada@example.com", "password": "secret123" }`
- `POST /auth/logout` — invalida token actual (requiere `Authorization: Bearer <token>`)
- `GET /auth/me` — devuelve usuario autenticado (requiere token)
- `GET /users` — lista usuarios (requiere token)
- `GET /users/:id` — obtiene usuario por id (requiere token)
- `PATCH /users/:id` — actualiza `name`, `email` y/o `password` (requiere token)
- `DELETE /users/:id` — elimina usuario (requiere token)

Notas de seguridad
- Las contraseñas se almacenan hasheadas con `bcryptjs`.
- Ningún endpoint devuelve el hash de contraseña.
- Los tokens JWT revocados (logout) quedan en una blacklist en memoria y son rechazados.

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

Estructura del proyecto (resumen)
- `src/index.js` — entry point (inicia servidor)
- `src/app.js` — fábrica de Express (configura middlewares y rutas)
- `src/config/` — configuración centralizada
- `src/controllers/` — controladores (lógica por ruta)
- `src/routes/` — definición y agregación de routers
- `src/middlewares/` — middlewares compartidos (p.ej. manejo de errores)

Contribuir
- Haz `git add .` y `git commit -m "mensaje"` para cambios locales.

Licencia
- MIT

Logging
-------

Este proyecto utiliza un sistema de logging estructurado con `winston` y
propagación de `correlationId` por request usando `AsyncLocalStorage`.

Puntos clave

- Correlation ID: si el cliente envía la cabecera `X-Correlation-Id`, se
	reutiliza; si no, el servicio genera un UUID por request. El valor se expone
	en la cabecera de respuesta `X-Correlation-Id`.
- Formato: en `NODE_ENV=production` los logs salen en JSON (útil para
	agregadores). En desarrollo se usa un formato coloreado y legible.
- Metadata fija: cada entrada incluye `service`, `version` y `environment`.
- Niveles: `http` para 2xx, `warn` para 4xx, `error` para 5xx. `LOG_LEVEL` es
	configurable vía variable de entorno.

Variables de entorno relevantes

- `NODE_ENV` — `development`/`production`
- `LOG_LEVEL` — nivel mínimo de logs (`debug`, `info`, `warn`, `error`, ...)

Ejemplos de uso

1) Logging en un controlador:

```javascript
const { logger } = require('../logger');

function createUser(req, res) {
	const { username } = req.body;
	logger.info('creating user', { username });
	// ... lógica
	res.status(201).json({ ok: true });
}
```

2) Incluir metadata adicional y errores:

```javascript
try {
	// operación que puede fallar
} catch (err) {
	logger.error('failed to do operation', { error: err.message, stack: err.stack });
	throw err; // o manejar según corresponda
}
```

3) Obtener el `correlationId` desde cualquier lugar en la pila (para incluirlo
	 en logs o payloads):

```javascript
const { requestContext } = require('../logger');
const store = requestContext.getStore();
const correlationId = store && store.correlationId;
```

Formato de ejemplo (producción - JSON):

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

Recomendaciones para producción

- Enviar logs a un colector/stack (Datadog, Loki, ELK, CloudWatch). Como los
	logs son JSON en `production`, son fácilmente ingeribles por dichos sistemas.
- Fijar `LOG_LEVEL` a `info` o `warn` en producción para reducir ruido.
- Asegurar que los microservicios en la cadena acepten y re-pasen `X-Correlation-Id`
	para traza distribuida completa.

¿Quieres que añada ejemplos de integración con un colector (p.ej. enviarlos a
Logstash o Datadog), o que agregue un badge que muestre el nivel de `LOG_LEVEL`?
