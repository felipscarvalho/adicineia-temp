# Relatório de implementação do frontend — DataQualiSUS

| Item | Valor |
|------|-------|
| Projeto | DataQualiSUS — COMP0503 Engenharia de Software, turma 02, UFS/DCOMP, 2026.2 |
| Equipe | P2611 |
| Escopo | SPA em `front/` para as telas T00–T07 da P2, consumindo a API de `back/` |
| Fontes de verdade | P1 v1.3, P2 v1.1 (ADR-001, ADR-006, ADR-007, ADR-008, telas T00–T07), P3 (estrutura do repositório) e o padrão de arquitetura do front descrito em `front/README.md` |
| Data das validações | 22/11/2026 |
| Commits | `8e437a2` a `f11396c` (versão Next.js) e `2b9cf91` a `904a302` (migração para SPA com Vite) na branch `main` (seção 9) |

Este relatório registra somente o que foi implementado e executado. O que depende de avaliação
humana (usabilidade, navegadores) ou de material externo está na seção 8.

---

## 1. Reorganização do repositório e ajuste no backend

| Commit | Mudança | Motivo |
|--------|---------|--------|
| `8e437a2` | `backend/` movido para `back/`; caminhos de testes, CI, scripts e relatórios atualizados | Pedido de reorganização para receber `front/`; `database/` e `tests/` continuam na raiz |
| `c620f07` | `POST /auth/entrar` e `GET /auth/sessao` passaram a devolver `permissoes` (operações do perfil, derivadas da mesma matriz do `AutorizacaoGuard`) | A interface precisa esconder ações vedadas sem manter outra cópia da matriz; o servidor continua sendo quem garante (RNF003) |

Depois das duas mudanças, o backend foi validado de novo: 320/320 testes unitários e 102/102 de
integração aprovados, lint e tipos sem erros.

---

## 2. Arquitetura implementada

A arquitetura segue `front/README.md` (o padrão combinado), com as adaptações da seção 7 daquele
documento. Resumo:

* **Stack:** SPA em React 19 + TypeScript (ADR-001), compilada pelo Vite 8 e com rotas no navegador
  pelo React Router 8; Untitled UI React (React Aria + Tailwind CSS 4, kit do CLI
  `untitledui init --vite`), axios, TanStack Query, Zustand, react-hook-form + Zod, moment, sonner
  (encapsulado), `@untitledui/icons`.
* **Fluxo de dados:** componente → hook (TanStack Query, `hooks/<módulo>/`) → service
  (`services/<módulo>/`) → `lib/api.ts` (único arquivo que importa axios) → `/api` → backend.
* **Sessão (ADR-006):** cookie HttpOnly/Secure/SameSite=Lax enviado com `withCredentials`; o
  interceptor acrescenta `X-CSRF-Token` em métodos que alteram estado; 401 limpa a sessão e volta a
  `/login`. O `user_store` guarda usuário, permissões e token CSRF em memória e os recupera com
  `revalidate()`; nada é persistido no navegador.
* **Mesmo domínio:** em desenvolvimento e no `vite preview`, o `vite.config.ts` encaminha `/api/*` ao
  backend (`API_PROXY_URL`); em produção, o nginx de `deploy/` faz o mesmo. Dispensa CORS.
* **Área logada:** rotas filhas do `AppShell` em `src/app.tsx` (rota de layout com `<Outlet />`:
  revalidação, sidebar por módulo filtrada pelas permissões). Cada tela fica em
  `pages/<rota>/_components/` (detalhes em `pages/<rota>/detalhe/`), é carregada com `lazy` (um
  pacote por rota) e define o título da aba com `TituloPagina` (`<title>` do React 19).
* **Erros:** `ApiError` normalizado; mutations com formulário exibem a mensagem e os erros de campo
  (`detalhes`) no próprio formulário; as demais caem num toast global (`MutationCache`).
* **Identidade visual:** padrão do Untitled UI, sem tema próprio (`styles/theme.css` como o CLI
  entrega, fonte Inter); modo claro/escuro pelo `ThemeProvider` do kit, seguindo o sistema por padrão.

### 2.1 Módulos do front e correspondência com o backend

| Módulo (types/services/hooks) | Endpoints consumidos | Telas |
|-------------------------------|----------------------|-------|
| `auth` | `/auth/entrar`, `/auth/sessao`, `/auth/sair` | T00 (`/login`), `AppShell` |
| `datasets` | `/datasets`, `/datasets/:id`, `/datasets/:id/versoes`, `/datasets/:id/versoes/:versaoId/registros` | T01 (`/datasets`, `/datasets/:id`) |
| `rules` | `/vocabularios`, `/catalogo`, `/regras`, `/regras/:id/revisoes`, `/conjuntos`, `/conjuntos/:id/revisoes`, `/conjuntos/:id/datasets/:datasetId` | T02/T03 (`/regras`, `/regras/:id`, `/conjuntos`, `/conjuntos/:id`, `/vocabularios`) |
| `simulations` | `/simulacoes`, `/simulacoes/:id` | T04 (`/simulacoes`, `/simulacoes/:id`) |
| `treatments` | `/tratamentos` | T05 (painel em `/simulacoes/:id`) |
| `audit` | `/auditoria/datasets`, `/auditoria/extratos`, `/auditoria/extratos/:id`, `/auditoria/extratos/:id/pdf` | T07 (`/auditoria`, `/auditoria/:id`) |
| `diagnostics` | `/diagnosticos/versoes`, `/diagnosticos/versoes/:versaoId`, `.../exportar?formato=` | T06 (`/diagnosticos`) |

---

## 3. Funcionalidades implementadas

### F01 — Autenticação e encerramento de sessão (T00)
* **Descrição:** formulário de entrada (e-mail e senha validados por Zod), mensagem genérica de
  credenciais inválidas vinda do backend, redirecionamento para a primeira tela do perfil, revalidação
  da sessão ao abrir a área logada, redirecionamento sem sessão e botão Sair com recarga completa.
* **Requisitos:** RF007, UC-08 (fluxos 2a, 4a), RNF003, ADR-006, DS4.
* **Arquivos:** `pages/login/login_pagina.tsx`, `pages/login/_components/login_form.tsx`, `schemas/auth/entrar.ts`,
  `services/auth/index.ts`, `types/auth/index.ts`, `stores/user_store.ts`, `components/layout/app_shell.tsx`,
  `pages/inicio_pagina.tsx`.
* **Testes:** `login_form.test.tsx` (3), `user_store.test.ts` (4), `app_shell.test.tsx` (2).
* **Commit:** `42f6ccb`.

### F02 — Controle de acesso por perfil na interface
* **Descrição:** sidebar por módulo filtrada pelas `permissoes` da sessão; `PermissionGate` bloqueia
  telas vedadas; `usePermissions().can/canAnywhere` esconde botões; token CSRF só em métodos que
  alteram estado; recusas 403 exibidas pelo toast global.
* **Requisitos:** RF007, seção 8.3 da P1 (matriz), RNF003, ADR-006.
* **Arquivos:** `components/navigation/sidebar.tsx`, `components/navigation/navegacao.ts`,
  `components/layout/permission_gate.tsx`, `hooks/use_permissions.ts`, `lib/api.ts`,
  `components/query_provider.tsx`; no backend, `auth/matriz-permissoes.ts` (`operacoesDoPapel`).
* **Testes:** `sidebar.test.tsx` (4), `permission_gate.test.tsx` (4), `navegacao.test.ts` (1).
* **Commits:** `c620f07` (back), `a93a8a4`.

### F03 — Importação de datasets CSV (T01)
* **Descrição:** listagem ativa com busca e contagens; modal de importação com nome, descrição,
  separador e arquivo; checagens de UX (extensão `.csv`, vazio, 10.000.000 bytes); envio multipart;
  motivo da rejeição do servidor exibido no modal.
* **Requisitos:** RF001, UC-01 (passos 2–4, fluxo 3a), seção 8.3, RNF005.
* **Arquivos:** `pages/datasets/_components/datasets_tela.tsx`, `_components/importar_dataset_modal.tsx`,
  `_components/tabela_datasets.tsx`, `components/datasets/campo_arquivo_csv.tsx`, `components/datasets/itens_separador.ts`,
  `schemas/datasets/arquivo_csv.ts`, `schemas/datasets/importar_dataset.ts`, `services/datasets/index.ts`,
  `hooks/datasets/use_datasets.ts`, `types/datasets/index.ts`.
* **Testes:** `importar_dataset.test.ts` (6), `datasets_tela.test.tsx` (6).
* **Commit:** `b2f9e08`.

### F04 — Manutenção de datasets com versões e exclusão lógica (T01)
* **Descrição:** detalhe com resumo, metadados editáveis direto (`useEditForm` + `FormActions`),
  estrutura da versão, histórico de versões com origem, SHA-256 e predecessora, registros paginados
  por versão (valores como texto), nova versão em modal e exclusão lógica com confirmação. Dataset
  excluído ou perfil sem edição veem a mesma estrutura só para leitura.
* **Requisitos:** RF001, RN04, UC-01 (fluxos 5a–5c), ADR-005, MOD-15.
* **Arquivos:** `pages/datasets/detalhe/_components/` (`dataset_detalhe_tela.tsx`,
  `metadados_form.tsx`, `tabela_versoes.tsx`, `registros_versao.tsx`, `nova_versao_modal.tsx`),
  `components/datasets/situacao_badge.tsx`, `schemas/datasets/metadados.ts`.
* **Testes:** `dataset_detalhe_tela.test.tsx` (8).
* **Commit:** `c667ee5`.

### F05 — Consulta de vocabulários oficiais versionados
* **Descrição:** lista com nome, versão, origem, licença, quantidade de códigos, hash e data;
  aviso de que a importação é feita por script e só a CID-10 é admitida; estado vazio informa o
  bloqueio das regras de vocabulário.
* **Requisitos:** RN02, ADR-009, MOD-13.
* **Arquivos:** `pages/vocabularios/`, `services/rules/vocabularios.ts`, `hooks/rules/use_vocabularios.ts`,
  `types/rules/vocabulario.ts`.
* **Testes:** `vocabularios_tela.test.tsx` (4).
* **Commit:** `24d9890`.

### F06 — Regras visuais e conjuntos com revisões (T02/T03)
* **Descrição:** construtor visual (`RegraCampos`) com dimensão, colunas tipadas, marcadores, até cinco
  condições por E ou OU, operadores filtrados por tipo e ações filtradas por dimensão a partir de
  `GET /catalogo`; conversão formulário ↔ configuração JSON; erros apontados pelo servidor levados ao
  campo; lista, criação em modal e detalhe editável de regra com revisões; conjuntos com ordem
  explícita, revisões com motivo e associação/desassociação a datasets.
* **Requisitos:** RF002, UC-02 (fluxos 4a, 6a–6c), RN01, RN02, ADR-002, ADR-005, MOD-04, MOD-16.
* **Arquivos:** `components/rules/` (`regra_campos.tsx`, `ordem_regras.tsx`, `descricao_regra.ts`,
  `dimensao_badge.tsx`, `aplicar_erros_servidor.ts`), `schemas/rules/regra.ts`, `schemas/rules/conjunto.ts`,
  `services/rules/regras.ts`, `services/rules/conjuntos.ts`, `hooks/rules/use_regras.ts`,
  `hooks/rules/use_conjuntos.ts`, `types/rules/regra.ts`, `pages/regras/**`, `pages/conjuntos/**`.
* **Testes:** `regra.test.ts` (17), `descricao_regra.test.ts` (1), `regras_tela.test.tsx` (5),
  `regra_detalhe_tela.test.tsx` (5), `conjuntos_tela.test.tsx` (4).
* **Commit:** `a357b61`.

### F07 — Simulação com acompanhamento do limite (T04)
* **Descrição:** escolha de dataset, versão e conjunto associado; solicitação (202) e abertura do
  acompanhamento; consulta a cada 1 s enquanto `EM_EXECUCAO` (`refetchInterval`); linhas violadas por
  regra, percentuais, totais distintos, prévia antes/depois de até 20 linhas, conferência do SHA-256;
  estados de tempo esgotado, falha, invalidação e simulação aplicada; histórico da versão.
* **Requisitos:** RF003, UC-03 (fluxos 3a, 3b, 5a), ADR-008, MOD-06, MOD-12.
* **Arquivos:** `pages/simulacoes/**` (`simulacoes_tela.tsx`, `simulacao_detalhe_tela.tsx`,
  `resultados_regras.tsx`, `previa_acoes.tsx`), `components/simulations/status_simulacao.tsx`,
  `services/simulations/index.ts`, `hooks/simulations/use_simulacoes.ts`, `types/simulations/index.ts`.
* **Testes:** `simulacoes_tela.test.tsx` (2), `simulacao_detalhe_tela.test.tsx` (4).
* **Commit:** `e7d7d61`.

### F08 — Consulta e exportação de extratos de auditoria (T07)
* **Descrição:** datasets com intervenções (inclusive excluídos), extratos com instante, versões,
  totais e ID técnico do usuário; extrato com os campos da RN03, regras e ações aplicadas, alterações
  por linha paginadas; exportação em PDF; indisponibilidade sem detalhes; nenhuma ação de edição.
* **Requisitos:** RF006, RN03, UC-06 (fluxos 2a, 2b, 5a), ADR-007, D04.
* **Arquivos:** `pages/auditoria/**`, `services/audit/index.ts`, `hooks/audit/use_auditoria.ts`,
  `types/audit/index.ts`, `lib/download.ts`.
* **Testes:** `auditoria_tela.test.tsx` (5).
* **Commit:** `c2da082`.

### F09 — Aplicação do tratamento com confirmação explícita (T05)
* **Descrição:** painel na simulação concluída e vigente, com as ações na ordem de aplicação
  (normalizações e, ao final, remoção de repetições) e totais previstos; modal de confirmação liberado
  só após marcar a revisão; envio com `confirmado: true`; resultado com nova versão e link do extrato;
  recusas (reaplicação, invalidação) exibidas no modal; sem painel quando não há alterações previstas.
* **Requisitos:** RF004, RN03, RN04, UC-04, UC-05, ADR-004.
* **Arquivos:** `pages/simulacoes/detalhe/_components/tratamento_painel.tsx`, `services/treatments/index.ts`,
  `hooks/treatments/use_tratamentos.ts`, `types/treatments/index.ts`.
* **Testes:** `tratamento_painel.test.tsx` (6).
* **Commit:** `0b54ba4`.

### F10 — Diagnóstico de qualidade com exportação (T06)
* **Descrição:** seleção da versão; três cartões sempre visíveis (unicidade, completude, validade)
  com percentual, aprovadas, total e linhas com violação; "Não avaliada" sem percentual; cobertura,
  versão, SHA-256, conjunto e instante; orientação para simular quando não há avaliação ou ela está
  desatualizada; exportação PDF e XLSX; aviso de não certificação.
* **Requisitos:** RF005, RN01, RN02, UC-07 (fluxos 2a, 3a, 5a), US05, US06, ADR-007, MOD-14.
* **Arquivos:** `pages/diagnosticos/**` (`diagnostico_tela.tsx`, `cartao_indicador.tsx`),
  `services/diagnostics/index.ts`, `hooks/diagnostics/use_diagnosticos.ts`, `types/diagnostics/index.ts`.
* **Testes:** `diagnostico_tela.test.tsx` (6).
* **Commit:** `fa4f507`.

---

## 4. Decisões técnicas

| ID | Decisão | Justificativa |
|----|---------|---------------|
| DF01 | Projeto criado pelo CLI do Untitled UI (`init --vite`), sem as páginas de demonstração do kit | Componentes base vindos da biblioteca indicada; arquivos alheios ao projeto removidos |
| DF02 | Sessão por cookie HttpOnly + CSRF, sem token no navegador | ADR-006; adaptação explícita do padrão de referência |
| DF03 | Proxy `/api` no servidor do Vite (dev e preview) e no nginx (produção) | Mesmo domínio para o cookie SameSite=Lax; sem CORS |
| DF04 | `permissoes` devolvidas pelo backend | Fonte única da matriz perfil × operação |
| DF05 | Rotas em `app.tsx` com `lazy` por tela e `AppShell` como rota de layout | Pacote inicial menor (459 kB em vez de 1,17 MB) e área logada num único ponto |
| DF06 | Sem `ClientOnly`: toda a aplicação roda no navegador | Não há renderização no servidor numa SPA |
| DF07 | Catálogo de operadores e ações lido de `GET /catalogo` | Evita duplicar o registro do ADR-002 no front |
| DF08 | Validação Zod só para UX; erros de campo do servidor mapeados para o formulário | O backend continua decidindo (P2, contêineres) |
| DF09 | Toast global para falhas de mutations sem formulário (`meta.erroTratadoNaTela`) | Recusas como 403 e coluna inexistente nunca ficam silenciosas |
| DF10 | Consulta periódica de 1 s só enquanto a simulação está em execução | ADR-008 (a SPA consulta o estado) |
| DF11 | Testes de tela com MSW sobre o cliente real e E2E com Playwright contra back/front compilados | Cobrir a camada inteira (componente → hook → service → cliente) e o sistema real |
| DF12 | Migração de Next.js para SPA com Vite + React Router, mantendo services, hooks, stores, schemas e telas | A ADR-001 define SPA em React; o Next trazia renderização no servidor não prevista na arquitetura |
| DF13 | Tema padrão do Untitled UI no lugar do `lawd-theme.css` | Decisão do grupo pela identidade visual padrão da biblioteca |
| DF14 | Vitest 4.1 (não o 5) | No Vitest 5 a conversão de `FormData` do jsdom trava o upload multipart sob o MSW; o 4.1 aceita o Vite 8 e mantém os testes de upload |

---

## 5. Tecnologias e dependências

Execução: `react`/`react-dom` 19.3, `react-router` 8.5, `react-aria-components` 1.21, `tailwindcss`
4.3, `@untitledui/icons` 0.0.23, `axios` 1.21.1, `@tanstack/react-query` 5.108.2, `zustand` 5.1.0,
`react-hook-form` 7.92.0, `zod` 4.6.7, `@hookform/resolvers` 5.9.2, `moment` 2.31.0, `sonner` 2.0.8.
Desenvolvimento: Vite 8.3 (`@vitejs/plugin-react`, `@tailwindcss/vite`), TypeScript 6, ESLint 9 +
`typescript-eslint` 8.73 + `eslint-plugin-react-hooks` 7.1, Prettier 3 (ordem de imports e classes
Tailwind), Vitest 4.1.12, `@vitest/coverage-v8` 4.1.12, Testing Library (React 16.3, user-event 14.6,
jest-dom 6.9.1), jsdom 26, MSW 2.15, Playwright 1.57. Versões exatas em
`front/package.json` e `front/package-lock.json`.

---

## 6. Testes

### 6.1 Testes de componentes, hooks e serviços (Vitest + Testing Library + MSW)

23 arquivos e 106 casos em `front/src/**/*.test.ts(x)`. As telas são renderizadas com os mesmos
provedores da aplicação (`src/test/render.tsx`) e o cliente HTTP real; o MSW (`src/test/servidor.ts`)
responde no formato da API, inclusive erros `{ statusCode, erro, mensagem, detalhes }`. Fixtures
sintéticas em `src/test/fixtures.ts`.

| Funcionalidade | Arquivos | Casos |
|----------------|----------|-------|
| Base | `lib/api.test.ts`, `lib/moment.test.ts`, `hooks/use_edit_form.test.tsx` | 9 |
| F01 | `login_form.test.tsx`, `user_store.test.ts`, `app_shell.test.tsx` | 9 |
| F02 | `sidebar.test.tsx`, `permission_gate.test.tsx`, `navegacao.test.ts` | 9 |
| F03 | `importar_dataset.test.ts`, `datasets_tela.test.tsx` | 12 |
| F04 | `dataset_detalhe_tela.test.tsx` | 8 |
| F05 | `vocabularios_tela.test.tsx` | 4 |
| F06 | `regra.test.ts`, `descricao_regra.test.ts`, `regras_tela.test.tsx`, `regra_detalhe_tela.test.tsx`, `conjuntos_tela.test.tsx` | 32 |
| F07 | `simulacoes_tela.test.tsx`, `simulacao_detalhe_tela.test.tsx` | 6 |
| F08 | `auditoria_tela.test.tsx` | 5 |
| F09 | `tratamento_painel.test.tsx` | 6 |
| F10 | `diagnostico_tela.test.tsx` | 6 |

Cobertura (V8, excluindo os componentes, provedores e utilitários copiados do kit Untitled UI):
**90,84% das linhas, 84,03% dos ramos, 83,8% das funções**. Os arquivos sem cobertura são
`app.tsx` (rotas), `pages/login/login_pagina.tsx`, `pages/inicio_pagina.tsx`,
`pages/nao_encontrada_pagina.tsx` e `components/layout/titulo_pagina.tsx`, exercitados no ensaio
ponta a ponta.

### 6.2 Ensaio ponta a ponta (Playwright)

`front/e2e/fluxo_completo.spec.ts`, contra `back/dist` (PostgreSQL 16 real) e a SPA compilada servida pelo `vite preview`,
em 1366 × 768: analista importa `tests/fixtures/csv/atendimentos.csv`, cria uma regra de cada dimensão,
monta e associa o conjunto, simula (linhas `3, 8, 14`, `6, 16` e `4, 9, 11`, iguais ao gabarito) e
aplica o tratamento (versão 2); gestor vê unicidade 91,67%, completude 87,50% e validade 87,50%,
cobertura completa, exporta o XLSX e é barrado em `/datasets`; equipe técnica abre o extrato
(remoções das linhas 6 e 16) e exporta o PDF; após o logout, a área logada volta para `/login`.

---

## 7. Resultados reais da execução (22/11/2026)

| Verificação | Comando (em `front/`) | Resultado |
|-------------|------------------------|-----------|
| Formatação | `npm run format:check` | Todos os arquivos no padrão |
| Lint | `npm run lint` | 0 erros, 0 avisos |
| Tipos | `npm run typecheck` | Sem erros |
| Testes | `npm test` | **106/106 aprovados**, 0 falhas |
| Build | `npm run build` | Concluído; arquivos estáticos em `dist/`, pacote inicial de 459 kB (142 kB gzip) e um pacote por tela |
| Ponta a ponta | `CHROMIUM_PATH=<chromium do Playwright> npm run test:e2e` | **1/1 aprovado** (~28 s) |
| Imagem de produção | `docker compose up` com o `docker-compose.yml` da raiz | SPA servida pelo nginx (fallback de rotas para `index.html`), login, upload de 9 MB e logout pelo HTTPS do proxy |
| Backend (regressão) | `npm test` em `back/` | 321/321 aprovados |

Ambiente: Linux x86_64, Node.js 24.13.0 (o CI usa Node.js 22), PostgreSQL 16.16.

---

## 8. Limitações e pendências

| ID | Pendência | Impacto |
|----|-----------|---------|
| PF01 | CTN004 (walkthrough de usabilidade) não foi conduzido | Usabilidade não comprovada por ensaio com integrantes (RNF004, Q06) |
| PF02 | CTN007: ensaio só no Chromium; Firefox não está instalado no ambiente | Compatibilidade com Firefox e leitura de PDF/XLSX em leitores externos não verificadas (RNF007) |
| PF03 | Identidade visual é a padrão do Untitled UI | Marca própria do DataQualiSUS, se desejada, exige revisão de `styles/theme.css` com autorização (componentes congelados) |
| PF04 | Pipeline do GitHub Actions (`front.yml`) não verificado nesta sessão (`gh` indisponível) | O resultado remoto precisa ser conferido |
| PF05 | O E2E instala o Chromium do Playwright no CI; localmente usa `CHROMIUM_PATH` | Diferença de versão do navegador entre ambientes |
| PF06 | `npm audit` aponta 4 vulnerabilidades moderadas (`postcss-selector-parser` via `@tailwindcss/typography` e `minimatch` via o plugin de ordenação de imports do Prettier) | Ferramentas de build e formatação, fora dos arquivos servidos; correção exige atualização com quebra |
| PF07 | Datas e números são exibidos no fuso e formato do navegador (pt-BR); o extrato mostra o instante UTC literal ao lado | Usuários em outro fuso veem horários locais |
| PF08 | O frontend não implementa importação de vocabulário nem cadastro de contas | Coerente com ADR-009 e com a seção 8.3 da P1 (feitos por script) |

---

## 9. Rastreabilidade e commits

| Funcionalidade | Requisitos | Telas | Testes | Commit |
|----------------|-----------|-------|--------|--------|
| Base | ADR-001, ADR-006 | — | `api.test.ts`, `use_edit_form.test.tsx` | `7a0bbdd` |
| F01 | RF007, UC-08, RNF003 | T00 | `login_form`, `user_store`, `app_shell`, E2E | `42f6ccb` |
| F02 | RF007, seção 8.3, RNF003 | todas | `sidebar`, `permission_gate`, E2E | `c620f07`, `a93a8a4` |
| F03 | RF001, UC-01, RNF005 | T01 | `importar_dataset`, `datasets_tela`, E2E | `b2f9e08` |
| F04 | RF001, RN04, ADR-005 | T01 | `dataset_detalhe_tela` | `c667ee5` |
| F05 | RN02, ADR-009 | T03 | `vocabularios_tela` | `24d9890` |
| F06 | RF002, UC-02, ADR-002 | T02, T03 | `regra`, `regras_tela`, `regra_detalhe_tela`, `conjuntos_tela`, E2E | `a357b61` |
| F07 | RF003, UC-03, ADR-008 | T04 | `simulacoes_tela`, `simulacao_detalhe_tela`, E2E | `e7d7d61` |
| F08 | RF006, RN03, UC-06 | T07 | `auditoria_tela`, E2E | `c2da082` |
| F09 | RF004, RN03, UC-04/05, ADR-004 | T05 | `tratamento_painel`, E2E | `0b54ba4` |
| F10 | RF005, RN01, UC-07, ADR-007 | T06 | `diagnostico_tela`, E2E | `fa4f507` |

| Commit | Mensagem |
|--------|----------|
| `8e437a2` | refactor: movido o backend para a pasta back |
| `c620f07` | feat(auth): informadas as permissões do perfil na sessão |
| `7a0bbdd` | chore(front): criada base do frontend em Next.js com Untitled UI |
| `42f6ccb` | feat(front): adicionada autenticação e encerramento de sessão (F01) |
| `a93a8a4` | feat(front): adicionado controle de acesso por perfil na interface (F02) |
| `b2f9e08` | feat(front): adicionada importação de datasets CSV na tela T01 (F03) |
| `c667ee5` | feat(front): adicionada manutenção de datasets com versões e exclusão lógica (F04) |
| `24d9890` | feat(front): adicionada consulta de vocabulários oficiais versionados (F05) |
| `a357b61` | feat(front): adicionadas regras visuais e conjuntos com revisões (F06) |
| `e7d7d61` | feat(front): adicionada simulação com acompanhamento do limite de tempo (F07) |
| `c2da082` | feat(front): adicionada consulta e exportação dos extratos de auditoria (F08) |
| `0b54ba4` | feat(front): adicionada aplicação do tratamento com confirmação explícita (F09) |
| `fa4f507` | feat(front): adicionado painel de diagnóstico com exportação PDF e XLSX (F10) |
| `e76cae2` | test(front): adicionado ensaio ponta a ponta com Playwright |
| `f11396c` | ci: adicionado pipeline do frontend com ensaio ponta a ponta |

### 9.1 Migração para SPA com Vite

O front foi refeito como SPA em React, conforme a ADR-001, com as mesmas regras de
`front/README.md` (Untitled UI, cliente axios único, TanStack Query, Zustand, react-hook-form + Zod)
e o tema padrão do Untitled UI. Cada commit reproduz o estado de uma funcionalidade da versão
anterior já na nova base; em todos, formatação, lint, tipos, testes e build passam.

| Commit | Mensagem | Testes |
|--------|----------|--------|
| `2b9cf91` | refactor(front): substituída a base Next.js por SPA React com Vite | 10 |
| `b15c980` | refactor(front): migrada a autenticação para a SPA (F01) | 19 |
| `f307a91` | refactor(front): migrado o acesso por perfil para a SPA (F02) | 27 |
| `ed4acf5` | refactor(front): migrada a importação de datasets CSV para a SPA (F03) | 39 |
| `f9028c3` | refactor(front): migrados os datasets e versões para a SPA (F04) | 47 |
| `a284f92` | refactor(front): migrada a consulta de vocabulários para a SPA (F05) | 51 |
| `e9209c3` | refactor(front): migradas as regras visuais e conjuntos para a SPA (F06) | 83 |
| `1ad5c84` | refactor(front): migrada a simulação com limite para a SPA (F07) | 89 |
| `a0de375` | refactor(front): migrados os extratos de auditoria para a SPA (F08) | 94 |
| `95ad7c3` | refactor(front): migrada a aplicação do tratamento para a SPA (F09) | 100 |
| `8e8eec8` | refactor(front): migrado o painel de diagnóstico para a SPA (F10) | 106 |
| `7377ba2` | test(front): adaptado o ensaio ponta a ponta ao vite preview | 106 + E2E |
| `904a302` | fix(front): regenerado o lockfile compatível com o npm 10 | 106 |
