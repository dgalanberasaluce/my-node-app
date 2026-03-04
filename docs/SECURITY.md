# Seguridad

Este documento resume las decisiones y recomendaciones de seguridad para `my-node-app`.

## Principios generales
- Mantener secretos fuera del repositorio y del control de versiones. Usar un gestor de secretos (Vault, AWS Secrets Manager, Azure Key Vault, etc.).
- Fallar al arrancar si variables críticas no están definidas en producción.
- Defender en profundidad: validación de entrada, autenticación robusta, logging seguro, y límites de tasa.

## Variables de entorno importantes
- `JWT_SECRET` — Obligatoria en `NODE_ENV=production`. No usar valores por defecto inseguros.
- `JWT_EXPIRES_IN` — Tiempo de expiración del token (p. ej. `1h`).
- `JWT_ISSUER`, `JWT_AUDIENCE` — Valores usados para validar tokens entrantes.
- `REDIS_URL` — Si está definido, la lista de tokens revocados se almacena en Redis.
- `PASSWORD_SALT_ROUNDS` — Factor de coste para `bcrypt` (configurable).

## JWT
- Los tokens contienen solo claims mínimos: `sub` (identificador del usuario) y `jti` (JWT ID) para permitir revocación.
- Al verificar un token se valida firma, algoritmo (`HS256` por defecto), `issuer` y `audience`.
- Para mayor seguridad en entornos distribuidos, considerar el uso de algoritmos asimétricos (RS256) y rotación de claves con `kid`.

## Revocación de tokens (logout)
- En entornos de desarrollo el proyecto usa una lista en memoria; en producción se debe usar `REDIS_URL` — el repositorio de tokens usa Redis con TTL.
- La revocación expira automáticamente cuando caduca el token.

## Contraseñas
- Las contraseñas se almacenan usando `bcrypt`.
- `PASSWORD_SALT_ROUNDS` debe definirse en entornos productivos (valor recomendado ≥12, balanceando coste/latencia).

## Validación de entradas
- Todos los endpoints de autenticación y actualización de recursos aplican validaciones básicas de formato y longitud.
- Se recomienda añadir esquemas estrictos (por ejemplo `Joi` o `ajv`) para cada ruta y limitar el tamaño del body (`express.json({ limit: '1mb' })`).

## Protección contra abusos
- Se ha añadido `express-rate-limit` con límites estrictos en endpoints de auth (p. ej. 10 intentos/15min por IP).
- Revisar y ajustar límites según tráfico y patrones reales.

## Logging y privacidad
- No registrar contraseñas ni tokens en texto plano. El logger redirige (redacts) campos sensibles (`password`, `token`, `authorization`, etc.).
- Para errores 5xx en producción, la respuesta al cliente es genérica; el stack y detalles quedan en logs internos.

## Dependencias y parches
- Ejecutar auditorías de dependencias regularmente (`pnpm audit`, SCA).
- Mantener dependencias actualizadas y sus parches aplicados.

## Despliegue y checklist previo a producción
1. Asegurar que `JWT_SECRET` está configurado y gestionado por un vault.
2. Definir `REDIS_URL` y confirmar conectividad si la app se ejecuta en más de una instancia.
3. Ajustar `PASSWORD_SALT_ROUNDS` y probar latencia.
4. Establecer `LOG_LEVEL=info` en producción y configurar colector de logs.
5. Habilitar HTTPS y configurar políticas de CORS/Content Security Policy según el cliente.

## Incidentes y rotación
- En caso de compromiso de `JWT_SECRET` o claves, rotar secretos y forzar revocación (añadir nueva validación de `kid` o cambiar `issuer`/`audience`).

## Contacto
Reporta vulnerabilidades a los mantenedores del repositorio vía issues o canal seguro.

---
Este fichero complementa la información técnica en el código y debe mantenerse sincronizado con los cambios de implementación.
