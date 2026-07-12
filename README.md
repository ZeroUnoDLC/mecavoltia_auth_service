# mecavoltia_auth_service

Servicio de identidad de Mecavoltia. Es el **único** dueño de credenciales, emisión de tokens y (en el futuro) roles. Ningún otro servicio almacena ni verifica contraseñas.

> Reglas de arquitectura, tipado y seguridad: ver [rules.md](./rules.md) — **cumplimiento obligatorio**.

## Diseño de identidad

- **JWT RS256 (asimétrico)**: este servicio firma con la clave privada; los demás servicios (web_back, futuro agente LangGraph, futura tienda) validan **localmente** con la clave pública. Nadie llama a este servicio para validar un token.
- **JWKS**: `GET /api/auth/.well-known/jwks.json` publica la clave pública. Cualquier servicio en cualquier lenguaje se integra apuntando ahí.
- **Access token corto (15 min) + refresh token con rotación** (7 días, un solo uso: refresh usado = refresh invalidado; reuso detectado = sesión revocada).
- **Sin registro público**: los 3 usuarios (socios) se crean por seed. No existe endpoint de signup.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | NestJS (TypeScript `strict`) |
| ORM | Prisma |
| Base de datos | PostgreSQL — database `mecavoltia_auth` (propia, separada de `mecavoltia_core`) |
| Hashing | argon2id |
| Tokens | RS256, claves por variables de entorno / secrets (jamás en el repo) |

## API prevista (fase 1)

- `POST /api/auth/login` — email + contraseña → access + refresh token
- `POST /api/auth/refresh` — rotación de refresh token
- `POST /api/auth/logout` — revoca la sesión
- `GET  /api/auth/me` — identidad del token presente
- `GET  /api/auth/.well-known/jwks.json` — clave pública (JWKS)

## Futuro

- Roles y permisos (claims en el JWT: los servicios autorizan localmente leyendo claims, sin consultar a este servicio).
- Clientes adicionales: tienda (`mecavoltia_shop`) y agente IA consumen esta misma identidad sin cambios aquí.

## Ejecución

```sh
# Desde la raíz del workspace — levanta postgres + traefik + este servicio
docker compose -f docker-compose.dev.yml up -d --build auth-service
```

El contenedor aplica `prisma migrate deploy` al arrancar y sirve en `http://localhost/api/auth/*` a través del gateway. Hot reload: `src/` y `prisma/` están montados como volumen.

Para trabajar desde el host (Prisma Studio, migraciones nuevas, seed): renombrar `env.text` a `.env` y usar `npm run prisma:migrate` / `npm run prisma:seed`. Las claves RS256 de dev se generan con `infra/scripts/generate-dev-keys.sh` (raíz del workspace).
