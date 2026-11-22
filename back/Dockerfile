# Imagem da API (Node.js 22 LTS, ADR-001). Contexto de build: raiz do repositório, para incluir
# database/ (migrações e papéis), resolvido em /app/database a partir de /app/back/dist.
FROM node:22-bookworm-slim AS build
WORKDIR /app/back
COPY back/package.json back/package-lock.json ./
RUN npm ci
COPY back/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    PORTA=3000 \
    ARMAZENAMENTO_DIR=/dados/armazenamento
WORKDIR /app/back
COPY --from=build --chown=node:node /app/back/package.json ./
COPY --from=build --chown=node:node /app/back/node_modules ./node_modules
COPY --from=build --chown=node:node /app/back/dist ./dist
COPY --chown=node:node database /app/database
# Diretório dos CSV imutáveis (ADR-003); o volume nomeado herda o dono definido aqui.
RUN mkdir -p /dados/armazenamento && chown -R node:node /dados
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/saude').then(r=>r.json()).then(s=>process.exit(s.banco==='disponivel'?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
