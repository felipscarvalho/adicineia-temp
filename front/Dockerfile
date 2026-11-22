# Imagem da SPA (Next.js). Contexto de build: front/.
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Em produção o nginx encaminha /api ao backend; o encaminhamento do Next fica como reserva.
ARG API_PROXY_URL=http://back:3000
ENV NEXT_PUBLIC_API_URL=/api \
    API_PROXY_URL=${API_PROXY_URL}
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/package.json /app/next.config.ts ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next ./.next
USER node
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3001/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node_modules/.bin/next", "start", "-H", "0.0.0.0", "-p", "3001"]
