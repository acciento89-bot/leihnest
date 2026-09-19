FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY . .
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ARG BETTER_AUTH_SECRET=build-only-secret-build-only-secret-1234
ARG BETTER_AUTH_URL=http://localhost:3000
ENV DATABASE_URL=$DATABASE_URL BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET BETTER_AUTH_URL=$BETTER_AUTH_URL
RUN npm run build

FROM deps AS migrator
WORKDIR /app
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs && mkdir -p /data/uploads && chown -R nextjs:nodejs /data/uploads
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
