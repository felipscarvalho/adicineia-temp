#!/bin/sh
# Sem certificado do Let's Encrypt ainda, gera um autoassinado provisório para o nginx subir;
# o serviço certbot o substitui pelo certificado real na primeira emissão.
set -eu
DIR="/etc/letsencrypt/live/${DOMINIO}"
if [ ! -f "${DIR}/fullchain.pem" ]; then
    echo "Gerando certificado provisório para ${DOMINIO}"
    mkdir -p "${DIR}"
    openssl req -x509 -nodes -newkey rsa:2048 -days 2 \
        -keyout "${DIR}/privkey.pem" -out "${DIR}/fullchain.pem" -subj "/CN=${DOMINIO}" >/dev/null 2>&1
    touch "${DIR}/.provisorio"
fi
