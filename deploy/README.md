# Implantação em produção

`docker-compose.yml` (raiz) sobe o DataQualiSUS completo em um servidor com Docker:

| Serviço | Função |
|---------|--------|
| `db` | PostgreSQL 16 (volume `pgdata`) |
| `migracao` | Execução única a cada subida: migrações, papel `dataqualisus_app` com privilégios mínimos (ADR-006) e contas de demonstração, se as senhas forem informadas |
| `back` | API NestJS, conectada como `dataqualisus_app`; CSVs imutáveis no volume `armazenamento` |
| `front` | SPA Next.js |
| `nginx` | HTTPS em 443, redirecionamento de 80, `/api/` para o back e o resto para o front |
| `certbot` | Emite o certificado do Let's Encrypt (HTTP-01) e renova a cada 12 h |

O ambiente de desenvolvimento e testes continua em `docker-compose.hml.yml`.

## Pré-requisitos

1. Registro DNS `A` (e `AAAA`, se houver IPv6) de `es.felipscarvalho.com.br` apontando para o servidor.
2. Portas 80 e 443 liberadas no firewall.
3. Docker com o plugin Compose.

## Subida

```bash
cp .env.producao.example .env      # preencha senhas e LETSENCRYPT_EMAIL; não versione o .env
docker compose up -d --build
docker compose ps                  # migracao deve terminar com "Exited (0)"
docker compose logs -f certbot     # acompanha a emissão do certificado
```

Enquanto o certificado real não é emitido, o nginx usa um certificado provisório autoassinado. O
certbot o substitui e o nginx recarrega sozinho em até 1 minuto. Para ensaiar sem gastar o limite de
emissões do Let's Encrypt, use `CERTBOT_STAGING=1` na primeira subida e, depois de validar, apague o
volume de certificados (`docker compose down && docker volume rm dataqualisus_letsencrypt`) e suba
de novo com `CERTBOT_STAGING=0`.

## Operação

```bash
# Atualizar após um git pull (as migrações novas são aplicadas pelo serviço migracao)
docker compose up -d --build

# Importar o vocabulário oficial (ADR-009): coloque o CSV em ./dados/
docker compose run --rm migracao node dist/cli/importar-vocabulario.js \
  --arquivo=/dados/importacao/cid10.csv --nome=CID-10 \
  --origem="<fonte oficial>" --versao="<versão>" --licenca="<condições de uso>"

# Remover arquivos CSV órfãos de tratamentos revertidos (DA02)
docker compose exec back node dist/cli/coletar-orfaos.js

# Cópia de segurança do banco
docker compose exec db pg_dump -U dataqualisus dataqualisus > backup-$(date +%F).sql
```

Os CSVs ficam no volume `dataqualisus_armazenamento`; faça backup dele junto com o banco, já que as
versões referenciam os arquivos pelo SHA-256.

## Segurança

* O `.env` contém as senhas do dono do esquema e do papel da aplicação; mantenha-o fora do Git e com
  permissão restrita (`chmod 600 .env`).
* O dono do esquema só é usado pela migração; a API usa `dataqualisus_app`, sem UPDATE/DELETE na
  auditoria e nas versões.
* As contas de demonstração têm a senha redefinida a cada subida enquanto `SEED_SENHA_*` estiver
  preenchido; esvazie essas variáveis para manter senhas alteradas.
* O banco não publica porta no servidor; acesso administrativo por `docker compose exec db psql`.
