# Ensaio ponta a ponta (Playwright)

`fluxo_completo.spec.ts` percorre T00–T07 pela interface com os três perfis, contra o backend real:
importar o CSV `tests/fixtures/csv/atendimentos.csv`, criar uma regra de cada dimensão, montar e
associar o conjunto, simular, aplicar o tratamento, consultar o diagnóstico (gestor) e o extrato de
auditoria (equipe técnica), exportar XLSX e PDF e encerrar as sessões. Os números conferidos vêm do
gabarito rotulado `atendimentos.gabarito.json`.

## Execução

```bash
docker compose -f ../docker-compose.hml.yml up -d  # PostgreSQL 16 em localhost:55432 (raiz do repositório)
(cd ../back && npm ci && npm run build)  # API compilada em back/dist
npm ci && npm run build                  # front compilado
npx playwright install chromium          # ou defina CHROMIUM_PATH=/caminho/do/chromium
npm run test:e2e
```

O Playwright sobe a API na porta 3000 e o front na 3001. Antes de iniciar a API,
`preparar_ambiente.mjs` recria o banco `dataqualisus_e2e`, aplica as migrações, cria as contas de
demonstração e importa a amostra sintética de CID-10. As senhas e o banco são exclusivos do ensaio
(`ambiente.ts`). A janela usa 1366 × 768 (RNF007).
