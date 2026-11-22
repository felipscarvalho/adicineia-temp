# SPA compilada pelo Vite e servida como arquivos estáticos. O nginx de deploy/ encaminha /api ao
# backend; aqui só há o fallback de rotas da SPA para index.html.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=5s --retries=10 CMD wget -q -O /dev/null http://127.0.0.1:3001/ || exit 1
