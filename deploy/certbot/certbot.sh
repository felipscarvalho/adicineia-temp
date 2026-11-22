#!/bin/sh
# Emite o certificado do Let's Encrypt pelo desafio HTTP-01 (webroot servido pelo nginx) e o
# renova a cada 12 h. Sem e-mail ou com falha, tenta de novo a cada hora sem derrubar o serviço.
set -u
DIR="/etc/letsencrypt/live/${DOMINIO}"
STAGING_FLAG=""
[ "${CERTBOT_STAGING:-0}" = "1" ] && STAGING_FLAG="--staging"

emitir() {
    if [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
        echo "LETSENCRYPT_EMAIL não definido; o nginx segue com o certificado provisório."
        return 1
    fi
    # Remove o certificado provisório para o certbot criar o diretório definitivo.
    [ -f "${DIR}/.provisorio" ] && rm -rf "${DIR}"
    certbot certonly --webroot -w /var/www/certbot -d "${DOMINIO}" \
        --email "${LETSENCRYPT_EMAIL}" --agree-tos --no-eff-email --non-interactive ${STAGING_FLAG}
}

sleep 10
while [ ! -f "/etc/letsencrypt/renewal/${DOMINIO}.conf" ]; do
    emitir && break
    echo "Emissão não concluída; nova tentativa em 1 h."
    sleep 3600
done

while :; do
    certbot renew --webroot -w /var/www/certbot --quiet
    sleep 12h
done
