#!/bin/sh
# Recarrega o nginx quando o certificado muda (emissão inicial ou renovação pelo certbot).
set -u
ARQUIVO="/etc/letsencrypt/live/${DOMINIO}/fullchain.pem"

assinatura() {
    echo "$(readlink -f "${ARQUIVO}" 2>/dev/null):$(md5sum "${ARQUIVO}" 2>/dev/null | cut -d' ' -f1)"
}

(
    anterior="$(assinatura)"
    while sleep 60; do
        atual="$(assinatura)"
        if [ "${atual}" != "${anterior}" ] && [ -f "${ARQUIVO}" ]; then
            echo "Certificado alterado; recarregando o nginx"
            nginx -s reload && anterior="${atual}"
        fi
    done
) &
