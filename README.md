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
- `GET /api/hello` — saludo simple
- `POST /api/echo` — devuelve el JSON recibido en el body

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
