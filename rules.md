# Reglas del proyecto — mecavoltia_auth_service

Reglas **estrictas y de cumplimiento obligatorio**. Comparte las reglas de arquitectura, tipado, errores, testing y commits de `mecavoltia_web_back/rules.md` (mismo esqueleto hexagonal, mismas convenciones — la consistencia entre los dos Nest es parte del contrato). Aquí se listan la estructura y las reglas **adicionales de seguridad**, que en este servicio mandan sobre todo lo demás.

## 1. Arquitectura

Misma estructura hexagonal que web_back:

```
src/
├── modules/
│   └── auth/         # login, refresh, logout, /me, JWKS
├── shared/
├── config/
└── main.ts
```

> El alta de usuarios es exclusivamente vía `prisma/seed.ts` (idempotente). El módulo `users` se creará recién cuando lleguen los roles — no antes.

- Regla de dependencias idéntica: `presentation → application → domain ← infrastructure`.
- `domain` sin frameworks; Prisma solo en `infrastructure`; HTTP solo en `presentation`.
- Naming y tipado: idénticos a `mecavoltia_web_back/rules.md` (secciones 2 y 3).

## 2. Reglas de seguridad (no negociables)

### Credenciales

- Hashing **argon2id** (memoria ≥ 19 MiB, iteraciones ≥ 2, paralelismo 1 — revisar parámetros OWASP al implementar).
- Prohibido: MD5, SHA-*, bcrypt con cost bajo, o cualquier hash "casero".
- La contraseña en texto plano vive solo el tiempo del request. **Jamás** se loguea, persiste ni viaja a otro servicio.
- Comparaciones en tiempo constante (lo da argon2.verify; no implementar comparaciones propias).

### Tokens

- **RS256 exclusivamente**. Prohibido HS256 (secreto compartido = acoplamiento y riesgo de fuga multiplicado).
- Claves privadas por variable de entorno o secret del entorno. **Jamás** en el repo, ni en `.env.example` con valores reales.
- Access token: TTL 15 minutos. Refresh token: TTL 7 días, **rotación de un solo uso** con detección de reuso (reuso → revocar toda la familia de sesiones).
- `kid` en el header del JWT desde el día uno (permite rotar claves sin downtime).
- Claims mínimos: `sub`, `email`, `iat`, `exp`, `iss`, `aud`. Futuro: `roles`. Nada de datos sensibles en el payload (el JWT es legible).

### Superficie de ataque

- **Sin endpoint de registro público.** Usuarios por seed idempotente.
- Rate limiting agresivo en `POST /login` y `POST /refresh` (por IP y por email).
- Respuesta de login fallido idéntica para "email no existe" y "contraseña incorrecta" (sin enumeración de usuarios).
- Nunca loguear: contraseñas, tokens, refresh tokens, headers `Authorization`. Los logs llevan `userId`, no identidades completas.
- Errores hacia afuera: genéricos. Detalle solo en logs internos.

## 3. Datos propios

- Database `mecavoltia_auth`, exclusiva de este servicio. Ningún otro servicio se conecta a ella.
- Otros servicios referencian usuarios **solo por `userId`** (el `sub` del JWT). Cero foreign keys hacia/desde otras databases.
- Tablas fase 1: `users`, `refresh_sessions`. Futuro: `roles`, `user_roles`.

## 4. Testing

- TDD estricto, igual que web_back.
- Cobertura obligatoria de los flujos de seguridad: login fallido, refresh reusado (revocación de familia), token expirado, token con firma inválida, rate limit alcanzado.

## 5. Evolución

- Roles se implementan como claims en el token: los servicios consumidores autorizan localmente. Este servicio jamás se convierte en un "policy server" consultado por request.
- Si un cambio requiere que otro servicio llame a este por request (forwardAuth, introspección remota), la propuesta se discute y se registra en Engram antes: rompe el principio de validación local que sostiene toda la topología.
