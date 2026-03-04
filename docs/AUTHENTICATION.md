
# Authentication (JWT)

This project includes a JWT-based authentication middleware that protects routes under `/api`.

Relevant files

- `src/middlewares/auth.js` — `authenticate` middleware.
- `src/routes/api.routes.js` — applies `router.use(authenticate)` to protect `/api`.
- `src/config/index.js` — exports `JWT_SECRET` and `JWT_EXPIRES_IN`.

Behavior

- The middleware expects the `Authorization: Bearer <token>` header.
- Responds `401` when the header is missing or malformed.
- Responds `403` when the token is invalid or expired. Messages distinguish between `Invalid token` and `Token has expired`.
- On success, the decoded payload is attached to `req.user` and `next()` is called.

Environment variables

- `JWT_SECRET` — secret used to sign/verify tokens (use a secure value in production).
- `JWT_EXPIRES_IN` — default token lifetime (e.g. `1h`).

Generate tokens (example)

```bash
# Generate a token signed with the default development secret
node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'user1'},process.env.JWT_SECRET||'change-me-in-production',{expiresIn:'1h'}))"
```

Curl example

```bash
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({sub:'user1'},'change-me-in-production',{expiresIn:'1h'}))")
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/hello
```

Common response codes

- `401` — `Authorization` header missing or malformed.
- `403` — invalid or expired token.
- `200` — valid token and access granted.

Notes

- `GET /health` is public and not protected by the middleware.
- In production, set `JWT_SECRET` via your environment or secret manager and rotate keys according to your security policy.

Internal references

- Middleware: `src/middlewares/auth.js`
- Protected routes: `src/routes/api.routes.js`
- Config: `src/config/index.js`
