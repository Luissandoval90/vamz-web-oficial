FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV VAMZ_STANDALONE=1
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build -- --webpack

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd --gid 1001 vamz && useradd --uid 1001 --gid vamz --no-create-home vamz
COPY --from=builder --chown=vamz:vamz /app/.next/standalone ./
COPY --from=builder --chown=vamz:vamz /app/.next/static ./.next/static
COPY --from=builder --chown=vamz:vamz /app/public ./public
COPY --from=builder --chown=vamz:vamz /app/scripts ./scripts
RUN mkdir -p /app/.next/cache /data && chown -R vamz:vamz /app/.next/cache /data
USER vamz
EXPOSE 3000
CMD ["sh", "-c", "node scripts/init-db.mjs && exec node server.js"]
