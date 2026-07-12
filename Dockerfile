# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# ── Desarrollo: hot reload con src/ y prisma/ montados como volumen ──
FROM base AS dev
ENV NODE_ENV=development
CMD ["npm", "run", "start:dev"]

# ── Producción: build + imagen mínima (se endurece en el paso 6) ──
FROM base AS build
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
USER node
CMD ["node", "dist/main"]
