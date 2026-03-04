# Autenticación (JWT)

Este proyecto incluye un middleware de autenticación basado en JWT para proteger las rutas bajo `/api`.

Archivos relevantes

- `src/middlewares/auth.js` — middleware `authenticate`.
- `src/routes/api.routes.js` — se aplica `router.use(authenticate)` para proteger `/api`.
- `src/config/index.js` — exporta `JWT_SECRET` y `JWT_EXPIRES_IN`.

Comportamiento

- El middleware espera la cabecera `Authorization: Bearer <token>`.
- Responde `401` cuando la cabecera falta o está mal formada.
- Responde `403` cuando el token es inválido o ha expirado. El mensaje diferencia entre token inválido y token expirado.
- En caso de éxito, el payload decodificado se adjunta en `req.user` y se invoca `next()`.

Variables de entorno

- `JWT_SECRET` — secreto para firmar/verificar tokens (usar un valor seguro en producción).
- `JWT_EXPIRES_IN` — duración por defecto (ej. `1h`).

Generar tokens (ejemplo)

```bash
# Genera un token firmado con el secreto por defecto de desarrollo
node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'user1'},process.env.JWT_SECRET||'change-me-in-production',{expiresIn:'1h'}))"
```

Ejemplo de uso con curl

```bash
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'user1'},'change-me-in-production',{expiresIn:'1h'}))")
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/hello
```

Códigos de respuesta habituales

- `401` — cabecera `Authorization` ausente o mal formada.
- `403` — token inválido o expirado. Mensajes: `Invalid token` o `Token has expired`.
- `200` — token válido y acceso concedido.

Notas

- La ruta `GET /health` no está protegida por el middleware.
- En producción, fija `JWT_SECRET` en el entorno y rota las claves según la política de seguridad de tu organización.

Referencias internas

- Middleware: `src/middlewares/auth.js`
- Rutas protegidas: `src/routes/api.routes.js`
- Config: `src/config/index.js`
