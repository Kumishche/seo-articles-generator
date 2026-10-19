# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Кэш npm и ретраи: при нестабильной сети пересборка не скачивает все заново
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=120000

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Rewrites на backend вычисляются при сборке, поэтому адрес передается как build arg
ARG BACKEND_URL=http://backend:8080
ARG NEXT_PUBLIC_SITE_DOMAIN=example.ru
ENV BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_SITE_DOMAIN=$NEXT_PUBLIC_SITE_DOMAIN \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Минимальный сервер из output: "standalone"
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
