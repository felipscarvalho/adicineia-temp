# Proxy reverso com HTTPS. Os modelos de templates/ passam pelo envsubst da imagem oficial.
FROM nginx:1.27-alpine
RUN apk add --no-cache openssl
COPY templates/ /etc/nginx/templates/
COPY 40-certificado-provisorio.sh 90-recarregar-certificado.sh /docker-entrypoint.d/
RUN chmod +x /docker-entrypoint.d/40-certificado-provisorio.sh /docker-entrypoint.d/90-recarregar-certificado.sh \
    && rm -f /etc/nginx/conf.d/default.conf
