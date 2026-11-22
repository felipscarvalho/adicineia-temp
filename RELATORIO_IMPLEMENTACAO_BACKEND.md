# Relatório de implementação do backend — DataQualiSUS

| Item | Valor |
|------|-------|
| Projeto | DataQualiSUS — COMP0503 Engenharia de Software, turma 02, UFS/DCOMP, 2026.2 |
| Equipe | P2611 |
| Escopo deste relatório | Backend (API NestJS), banco PostgreSQL 16, testes automatizados e integração contínua |
| Fontes de verdade | P1 v1.3 (requisitos), P2 v1.1 (análise, projeto e arquitetura), P3 (template e estrutura do repositório), base de conhecimento "contexto ampliado" |
| Data da execução das validações | 22/11/2026 (UTC 04:09) |
| Commits | `4a3746d` a `97bbd0c` na branch `main` (seção 12) |

Este relatório descreve somente o que foi implementado e executado. Resultados de testes e de
execução são os obtidos nesta data, no ambiente descrito na seção 9. O que não foi executado ou
depende de material externo está na seção 10.

---

## 1. Análise documental

### 1.1 Documentos analisados

| Documento | Conteúdo usado |
|-----------|----------------|
| P1 v1.3 | OBJ01–OBJ06; RN01–RN04; RF001–RF007 com critérios CA/CT; seção 8.3 (contrato de importação, tipos, condições, dimensões, vocabulários, ações, indicadores, perfis, tempo e saída); RNF001–RNF007 com CTN001–CTN007; requisitos de dados D01–D06; US01–US08; UC01–UC03; backlog PB01–PB10; questões Q01–Q06 |
| P2 v1.1 | Drivers arquiteturais; C4 níveis 1–3 e a tabela de operações dos componentes; tabelas principais e sequência transacional do tratamento; glossário; MOD-01 a MOD-16; UC-01 a UC-08; ADR-001 a ADR-009; DS1–DS4; máquina de estados; telas T00–T07; matriz de rastreabilidade |
| P3 (template) | Seção 3 (ATAM: cenários C1–C6, A1–A6, riscos RA01–RA05), seção 4 (débitos DA01–DA06), seção 5 (F1–F6, estrutura de código), seção 6.1 (estrutura do repositório), 6.2–6.3 (branches e Conventional Commits), seção 9 (CI) |
| Contexto ampliado | Resumo das fontes, divergências Q01–Q06 e orientação de citar identificadores |

### 1.2 Identificação das 10 funcionalidades

Os documentos não trazem uma lista numerada "das 10 funcionalidades". A decomposição abaixo foi
derivada dos componentes da API no C4 nível 3 da P2 (autorização; datasets e validação de CSV;
regras e vocabulários; simulação; execução com limite; tratamento; diagnóstico; auditoria;
exportação; repositórios e armazenamento), dos itens funcionais do backlog PB01–PB07 da P1 e das
funcionalidades F1–F6 da P3. Ela cobre integralmente RF001–RF007 e RN01–RN04, sem acrescentar
comportamento fora do catálogo.

| ID | Funcionalidade | RF/RN principais | Backlog P1 | Funcionalidade P3 |
|----|----------------|------------------|------------|-------------------|
| F01 | Autenticação e sessão no servidor | RF007, RNF003 | PB07 | F1 |
| F02 | Autorização por perfil e proteção CSRF | RF007, RNF003, RNF005 | PB07 | F1 |
| F03 | Importação e validação de CSV com armazenamento imutável | RF001, RN04, RNF001, RNF005 | PB01, PB08 | F2 |
| F04 | Manutenção de datasets: consulta, metadados, versões e exclusão lógica | RF001, RN04 | PB01 | F2 |
| F05 | Vocabulários oficiais versionados | RN02 | PB02 | F3 |
| F06 | Regras visuais e conjuntos com revisões | RF002, RN01, RN02, RNF006 | PB02, PB10 | F3 |
| F07 | Simulação com execução limitada a 60 s | RF003, RN01, RN04, RNF001, RNF002 | PB03, PB08 | F4 |
| F08 | Extrato de auditoria somente de inserção, consulta e PDF | RF006, RN03, RN04 | PB06 | F5 |
| F09 | Aplicação transacional do tratamento | RF004, RN03, RN04, RNF001 | PB04 | F5 |
| F10 | Diagnóstico de qualidade e exportação PDF/XLSX | RF005, RN01, RN02, RNF005 | PB05 | F6 |

### 1.3 Consistência com o escopo

- Somente backend: a SPA (React, ADR-001) não foi implementada; a API expõe tudo que as telas
  T00–T07 consomem.
- Dimensões limitadas a unicidade, completude e validade (RN01, MOD-10); não há "consistência",
  "conformidade" nem estado de atestado.
- Catálogo fechado de operadores e das quatro ações (P1, seção 8.3). Não há `eval`, SQL gerado,
  expressões regulares livres nem comparação entre colunas (ADR-002).
- Sem autocadastro nem tela de administração: as contas são provisionadas por script (seção 8.3).
- Sem integração externa em tempo real: vocabulários entram por script (ADR-009).

---

## 2. Arquitetura implementada

### 2.1 Organização do repositório

A estrutura segue a seção 6.1 da P3:

```
/README.md, /.gitignore, /.env.example, /docker-compose.yml
/backend/                 API NestJS (package.json, tsconfig, jest, eslint, prettier)
  src/auth/               F01, F02
  src/datasets/           F03, F04
  src/rules/              F06 (regras, conjuntos, motor/) e F05 (vocabularios/)
  src/simulations/        F07
  src/audit/              F08
  src/treatments/         F09
  src/diagnostics/        F10 (e exportacao/, usada também por F08)
  src/config, src/database, src/common, src/saude, src/cli
/database/                migrações SQL 0001–0007, papeis.sql, README
/tests/integracao/        testes de integração CT/CTN
/tests/fixtures/          CSVs sintéticos com gabaritos e amostra de vocabulário
/.github/workflows/       CI do backend
```

### 2.2 Módulos NestJS e dependências

```
AppModule
├── ConfiguracaoModule (global)   variáveis de ambiente validadas
├── DatabaseModule (global)       pool pg, consultas parametrizadas, unidade de trabalho
├── AuthModule                    AutenticacaoService, AutorizacaoGuard (APP_GUARD global)
├── DatasetsModule                DatasetService, ValidadorCsv, ArmazenamentoArquivosService, VersionamentoService
├── RulesModule ──► DatasetsModule, VocabulariosModule
│                                 RegraService, ConjuntoService, NotificadorRevisaoConjunto, MotorRegras (funções)
├── SimulationsModule ──► DatasetsModule, RulesModule
│                                 SimulacaoService, ExecutorComLimite, worker
├── AuditModule ──► DatasetsModule, ExportacaoModule
├── TreatmentsModule ──► DatasetsModule, SimulationsModule, AuditModule
└── DiagnosticsModule ──► DatasetsModule, RulesModule, SimulationsModule, ExportacaoModule
```

Não há dependência circular. O módulo de regras não conhece o de simulações: a invalidação de
simulações após uma revisão de conjunto é feita por um observador (`NotificadorRevisaoConjunto`)
que o módulo de simulações registra na inicialização.

### 2.3 Correspondência com os componentes da P2 (C4 nível 3)

| Componente P2 | Implementação | Operações da P2 implementadas |
|---------------|---------------|-------------------------------|
| AutorizacaoGuard | `auth/autorizacao.guard.ts`, `auth/matriz-permissoes.ts` | `validarSessao(cookie)`, `verificarPermissao(perfil, operação)` |
| AutenticacaoService | `auth/autenticacao.service.ts`, `auth/senha.service.ts` | `entrar`, `criarSessao`, `invalidar` (bcrypt; ver A02) |
| DatasetService | `datasets/dataset.service.ts` | `importar`, `importarNovaVersao`, `atualizarMetadados`, `excluirLogicamente` |
| ValidadorCsv | `datasets/validador-csv.ts` | `validar(arquivo): ResultadoValidacao` |
| RegraService | `rules/regra.service.ts`, `rules/conjunto.service.ts` | `salvarRegra` (criar/atualizar), `validarParametros`, `salvarConjunto`, `associar` |
| VocabularioService | `rules/vocabularios/vocabulario.service.ts` | `listarDisponiveis`, `obter`, `contem` |
| SimulacaoService | `simulations/simulacao.service.ts` | `simular`, `validarVigencia`, `obterResultado` (`obter`) |
| ExecutorComLimite | `simulations/executor-com-limite.ts` | `executar(tarefa, limite): Resultado \| TEMPO_ESGOTADO` |
| MotorRegras | `rules/motor/motor-regras.ts` | `avaliar`, `preverAcoes`, `aplicarAcoes` |
| TratamentoService | `treatments/tratamento.service.ts` | `aplicar(simulacaoId, confirmado)` |
| VersionamentoService | `datasets/versionamento.service.ts` | `gravarArquivo`, `criarVersaoDerivada` |
| AuditoriaService | `audit/auditoria.service.ts` | `registrarExtrato(operação, alterações, tx)`, `listarExtratos` |
| DiagnosticoService | `diagnostics/diagnostico.service.ts`, `diagnostics/calculo-indicadores.ts` | `obterDiagnostico(versaoId)`, `calcularIndicadores` |
| ExportacaoService | `diagnostics/exportacao/exportacao.service.ts` | `exportarDiagnostico(dto, formato)`, `exportarExtratoPdf(extrato)` |
| Repositórios | `*.repository.ts` | `salvar`, `buscarAvaliacaoVigente` (`ultimaAvaliacao`), `atualizarSituacao`, `buscarPorEmail` |
| Armazenamento de arquivos | `datasets/armazenamento-arquivos.service.ts` | gravação por hash, leitura, integridade, coleta de órfãos |

### 2.4 Tabelas (P2, "Persistência, transações e integridade")

`usuario`, `sessao`, `dataset`, `versao_dataset`, `vocabulario`, `vocabulario_codigo`, `regra`,
`regra_revisao`, `conjunto_regras`, `conjunto_revisao`, `conjunto_dataset`, `simulacao`,
`resultado_regra`, `extrato_auditoria`, `alteracao_registro`, `diagnostico`, `indicador`.
Gatilhos rejeitam `UPDATE`/`DELETE` em `versao_dataset`, `regra_revisao`, `conjunto_revisao`,
`extrato_auditoria` e `alteracao_registro`. O conteúdo dos CSV nunca vai para colunas do banco.

---

## 3. Funcionalidades implementadas

### F01 — Autenticação e sessão no servidor

**Descrição.** Entrada com e-mail e senha de contas previamente cadastradas, criação de sessão no
PostgreSQL vinculada ao usuário e ao perfil, consulta da sessão atual e logout que encerra a
sessão no servidor. O cookie `dq_sessao` é `HttpOnly`, `Secure`, `SameSite=Lax`, com caminho
`/api`. O banco guarda apenas o SHA-256 do token (32 bytes aleatórios). Credenciais inválidas e
e-mail inexistente recebem a mesma mensagem ("Credenciais inválidas."); para e-mail inexistente
é feita uma comparação bcrypt de referência, evitando diferença de tempo. Sessão expirada,
encerrada ou de usuário inativo é recusada com 401.

**Requisitos atendidos.** RF007 (CA007/CT007), UC-08 (fluxos 2a, 4a), RNF003 (hash com salt
aleatório; senhas iguais → hashes distintos), ADR-006 (sessão no servidor, cookie), D05.

**Arquivos e classes.** `backend/src/auth/`: `AutenticacaoService`, `SenhaService`,
`SessaoRepository`, `UsuarioRepository`, `AutenticacaoController` (`POST /auth/entrar`,
`GET /auth/sessao`, `POST /auth/sair`), `cookie-sessao.ts`, `decoradores.ts` (`@Publica`,
`@UsuarioAtual`), `dto/entrar.dto.ts`; `database/migrations/0001_autenticacao.sql`;
`backend/src/cli/seed-contas-demo.ts` (`npm run db:seed`).

**Testes.** Unitários: `autenticacao.service.spec.ts` (11), `senha.service.spec.ts` (3).
Integração: `tests/integracao/ct007-autenticacao.e2e-spec.ts` (10).

### F02 — Autorização por perfil e proteção CSRF

**Descrição.** `AutorizacaoGuard` é registrado como guard global. Em toda rota não marcada como
pública ele: (1) valida a sessão (401); (2) em `POST/PUT/PATCH/DELETE`, exige o cabeçalho
`X-CSRF-Token` igual ao token da sessão, comparado em tempo constante (403 `CSRF_INVALIDO`);
(3) verifica a operação declarada na rota contra a matriz perfil × operação (403
`OPERACAO_NAO_PERMITIDA`). Uma rota protegida sem operação declarada é negada (falha fechada).

**Requisitos atendidos.** RF007 e seção 8.3 (analista RF001–RF006; gestor RF005–RF006; equipe
técnica RF006; RF007 para todos), UC-08 fluxo 4b, RNF003/CTN003, ADR-006 (matriz em cada rota,
token CSRF), cenário C3 e risco RA03 do ATAM (rota sem guarda).

**Arquivos e classes.** `auth/matriz-permissoes.ts` (`Operacao`, `MATRIZ_PERMISSOES`,
`verificarPermissao`), `auth/autorizacao.guard.ts`, `@ExigeOperacao` em `auth/decoradores.ts`,
`auth/auth.module.ts` (`APP_GUARD`).

**Testes.** Unitários: `autorizacao.guard.spec.ts` (10), `matriz-permissoes.spec.ts` (5).
Integração: `tests/integracao/ctn003-autorizacao.e2e-spec.ts` (8) — descobre automaticamente
todas as rotas dos controladores (`suporte/rotas.ts`) e testa cada uma sem sessão, após logout e
com cada perfil vedado; confirma que só `/api/auth/entrar` e `/api/saude` são públicas.

### F03 — Importação e validação de CSV com armazenamento imutável

**Descrição.** `POST /datasets` recebe `multipart/form-data` (`arquivo`, `nome`, `descricao`,
`separador` = `VIRGULA` | `PONTO_E_VIRGULA`). O `ValidadorCsv` aplica, antes de qualquer gravação:
extensão `.csv`; arquivo não vazio; UTF-8 estrito (com ou sem BOM); ausência de caractere nulo;
leitura em fluxo com `csv-parse` (aspas duplas, número de campos constante); cabeçalho com nomes
não vazios e únicos; pelo menos um registro; limites inclusivos de 10.000.000 bytes, 100.000
registros e 100 colunas. Rejeições retornam 422 com código e motivo (`LIMITE_BYTES_EXCEDIDO`,
`CABECALHO_DUPLICADO`, `ESTRUTURA_INCONSISTENTE`, ...). Uploads muito acima do limite são
interrompidos pelo multer (413). O arquivo aprovado é gravado em `ARMAZENAMENTO_DIR` com nome
`<sha256>.csv`, por escrita em arquivo temporário e renomeação, com permissão somente leitura; o
nome enviado pelo usuário é apenas metadado sanitizado. Em seguida, `dataset` e a versão 1 são
inseridos na mesma transação. Uma falha no banco deixa no máximo um arquivo sem referência, que a
coleta de órfãos remove (`npm run armazenamento:coletar-orfaos`, com carência para gravações em
andamento).

**Requisitos atendidos.** RF001 (CA001/CT001: limites exatos e +1, arquivo vazio, cabeçalho
duplicado, estrutura inválida, sem persistência parcial), UC-01 passos 2–4 e fluxos 3a/3b, RN04,
RNF001/CTN001 (falha de persistência na importação), RNF005/CTN005 (binário renomeado, `../`,
HTML, texto de injeção SQL tratados como dado), ADR-003, DS1, DA02 (coleta de órfãos).

**Arquivos e classes.** `datasets/validador-csv.ts` (`ValidadorCsv`), `datasets/limites-csv.ts`,
`datasets/leitor-csv.ts` (`lerCsv`, `escreverCsv`), `datasets/armazenamento-arquivos.service.ts`
(`ArmazenamentoArquivosService`), `datasets/dataset.service.ts` (`importar`),
`datasets/dataset.repository.ts`, `datasets/dataset.controller.ts`, `datasets/dto/importar-dataset.dto.ts`,
`database/migrations/0002_datasets.sql`, `cli/coletar-orfaos.ts`.

**Testes.** Unitários: `validador-csv.spec.ts` (27, incluindo exatamente 100.000 registros,
100 colunas e 10.000.000 bytes e cada limite + 1), `armazenamento-arquivos.service.spec.ts` (5),
`leitor-csv.spec.ts` (2), `dataset.service.spec.ts` (8). Integração:
`ct001-importacao.e2e-spec.ts` (17).

### F04 — Manutenção de datasets: consulta, metadados, versões e exclusão lógica

**Descrição.** Listagem ativa (`GET /datasets`), consulta com histórico de versões
(`GET /datasets/:id`, também para dataset excluído), consulta paginada dos registros de uma versão
lida do arquivo imutável (`GET /datasets/:id/versoes/:versaoId/registros`), edição apenas de
nome e descrição (`PATCH`), importação de nova versão vinculada à mais recente
(`POST /datasets/:id/versoes`, com o dataset bloqueado por `FOR UPDATE` durante a numeração) e
exclusão lógica (`DELETE` muda a situação para `EXCLUIDO_LOGICAMENTE`). Dataset excluído fica fora
da listagem e recusa novas operações (409 `DATASET_EXCLUIDO`); versões, arquivos e extratos
permanecem. Um gatilho impede `UPDATE`/`DELETE` em `versao_dataset`.

**Requisitos atendidos.** RF001, UC-01 passo 5 e fluxos 5a–5c, RN04, ADR-005, MOD-01, MOD-15,
cenário A5 do ATAM.

**Arquivos e classes.** `datasets/dataset.service.ts` (`listar`, `consultar`, `listarVersoes`,
`atualizarMetadados`, `importarNovaVersao`, `excluirLogicamente`, `consultarRegistros`,
`exigirAtivo`), `datasets/dataset.controller.ts`, `datasets/dataset.tipos.ts`,
`datasets/dto/atualizar-metadados.dto.ts`, `datasets/versionamento.service.ts`.

**Testes.** Unitários: `dataset-manutencao.spec.ts` (13). Integração: `ct001-manutencao.e2e-spec.ts` (8).

### F05 — Vocabulários oficiais versionados

**Descrição.** A equipe de desenvolvimento importa vocabulários por script
(`npm run vocabulario:importar`), informando nome, origem, versão e licença; o sistema guarda o
SHA-256 do arquivo e os códigos como texto (preservando zeros à esquerda), recusa códigos vazios
ou repetidos, recusa nomes fora da baseline (somente `CID-10`) e não permite reimportar o mesmo par
nome/versão (409). O analista lista e consulta os vocabulários disponíveis
(`GET /vocabularios`). Não existe rota de importação.

**Requisitos atendidos.** RN02 (CID-10, TUSS fora da baseline, vocabulário ausente bloqueia a
regra), ADR-009 (tabelas `vocabulario` e `vocabulario_codigo`, importação por script), MOD-13, D06.

**Arquivos e classes.** `rules/vocabularios/`: `VocabularioService`, `VocabularioRepository`,
`importador-vocabulario.ts` (`prepararVocabulario`), `vocabulario.controller.ts`,
`vocabulario.tipos.ts` (`VOCABULARIOS_ADMITIDOS`); `cli/importar-vocabulario.ts`;
`database/migrations/0003_vocabularios.sql`; amostra de teste
`tests/fixtures/vocabularios/cid10-amostra-teste.csv`.

**Testes.** Unitários: `importador-vocabulario.spec.ts` (11), `vocabulario.service.spec.ts` (4).
Integração: `ct002-vocabularios.e2e-spec.ts` (4).

### F06 — Regras visuais e conjuntos com revisões

**Descrição.** Regras são JSON validado por esquema próprio (`validarConfiguracaoRegra`), que
aponta o campo inválido (422 `CONFIGURACAO_INVALIDA` com `detalhes[{campo, mensagem}]`):

- **Unicidade:** chave de uma ou mais colunas tipadas; ação opcional `REMOVER_REPETICOES`.
- **Completude:** até cinco colunas e marcadores de ausência declarados (ex.: `ignorado`);
  ações opcionais `PREENCHER_VAZIO`, `APARAR_ESPACOS`, `CONVERTER_CAIXA`.
- **Validade:** até cinco condições ligadas só por `E` ou só por `OU`; operadores do registro
  (`IGUAL`, `DIFERENTE`, `VAZIO`, `NAO_VAZIO`, `PERTENCE_LISTA` para texto; `MAIOR`,
  `MAIOR_IGUAL`, `MENOR`, `MENOR_IGUAL` para decimal e data; `PERTENCE_VOCABULARIO` para códigos
  clínicos), constante do tipo declarado (decimal com ponto, data `AAAA-MM-DD`).

São rejeitados: operador fora do catálogo ou incompatível com o tipo, condição incompleta, mais de
cinco condições, vocabulário sem versão ou indisponível, ação fora do catálogo ou incompatível,
campos fora do esquema (ex.: `script`, `sql`, `colunaComparada`). Conjuntos guardam as regras na
ordem explícita e recusam nomes duplicados, duas ações de escrita na mesma coluna e a mesma coluna
com tipos diferentes. Cada edição de regra cria nova revisão da regra e de todos os conjuntos
ativos que a usam; cada edição de conjunto cria nova revisão; ambas acionam a invalidação das
simulações anteriores. Revisões são imutáveis (gatilhos) e consultáveis. A associação conjunto ↔
dataset rejeita colunas inexistentes na versão atual. Exclusões são lógicas; uma regra em uso em
conjunto ativo não pode ser excluída (409 `REGRA_EM_USO`). `GET /catalogo` publica operadores,
ações, tipos e limites para a interface.

**Requisitos atendidos.** RF002 (CA002/CT002), UC-02 (fluxos 4a, 6a, 6b, 6c), RN01, RN02,
ADR-002 (JSON por esquema, registro de operadores e ações, sem eval/SQL), ADR-005 (revisões),
MOD-03, MOD-04, MOD-12, MOD-16, RNF005, RNF006 (ponto de extensão).

**Arquivos e classes.** `rules/motor/tipos.ts`, `rules/motor/conversao.ts`,
`rules/motor/registro-operadores.ts` (`REGISTRO_OPERADORES`), `rules/motor/registro-acoes.ts`
(`REGISTRO_ACOES`), `rules/motor/validacao-configuracao.ts` (`validarConfiguracaoRegra`,
`validarConjunto`, `verificarColunas`), `rules/regra.service.ts` (`RegraService`),
`rules/conjunto.service.ts` (`ConjuntoService`), `rules/notificador-revisao.ts`,
`rules/regras.repository.ts`, `rules/regras.controller.ts`, `rules/catalogo.ts`,
`rules/dto/regra.dto.ts`, `database/migrations/0004_regras.sql`.

**Testes.** Unitários: `conversao.spec.ts` (32), `registro-operadores.spec.ts` (25),
`registro-acoes.spec.ts` (5), `validacao-configuracao.spec.ts` (47), `regra.service.spec.ts` (8),
`conjunto.service.spec.ts` (7), `extensao-operador.spec.ts` (1, CTN006 parcial). Integração:
`ct002-regras.e2e-spec.ts` (16).

### F07 — Simulação com execução limitada a 60 s

**Descrição.** `POST /simulacoes` (versão + conjunto) verifica: versão existente, dataset ativo,
conjunto ativo e associado ao dataset, conjunto com regras, colunas existentes na versão e
vocabulários disponíveis; recusas não registram simulação. Aceita a requisição, grava a
`configuracao_executada` (versão e hash, conjunto e revisão, regras com revisão e configuração,
vocabulários com origem/versão/licença/hash, limite) com status `EM_EXECUCAO` e responde 202. A
tarefa vai ao `ExecutorComLimite`, um pool de `worker_threads` cujo cronômetro começa no instante
de aceite registrado (inclusive durante a espera na fila); ao atingir o limite o worker é
encerrado (`terminate`) e a simulação fica `TEMPO_ESGOTADO`. No worker, o arquivo da versão tem o
SHA-256 conferido, é lido e avaliado pelo `MotorRegras`:

- unicidade em uma passagem com tabela hash (primeira ocorrência na ordem original é a
  representante; cada repetição posterior é violação);
- completude e validade por linha; erro de conversão é violação de validade e a linha não é
  descartada; campo vazio falha nas comparações, exceto `VAZIO`;
- previsão das ações sobre uma cópia: normalizações na ordem do conjunto e remoção de repetições
  depois delas; contagem de linhas alteradas/removidas uma vez por linha; prévia de até 20 linhas
  com valores antes/depois.

O resultado (IDs das linhas violadas por regra, totais, prévia, hash conferido) é gravado em
`resultado_regra`/`simulacao` somente se a simulação ainda estiver `EM_EXECUCAO`. A integridade do
arquivo é conferida de novo ao final. Edições de regra/conjunto marcam simulações `CONCLUIDA` como
`INVALIDADA`. `GET /simulacoes/:id` informa status, vigência, `aplicavel`, resultados e a
configuração executada. Simulações em andamento durante um reinício são marcadas `FALHA`.

**Requisitos atendidos.** RF003 (CA003/CT003: IDs por regra, total de linhas distintas, total
previsto, prévia de até 20 linhas, SHA-256 antes/depois, timeout sem versão nem auditoria), UC-03
(fluxos 3a, 3b, 5a), RN01, RN02, RN04, RNF001 (timeout), RNF002/CTN002, OBJ06, ADR-002, ADR-005,
ADR-008, MOD-05, MOD-06, MOD-12, MOD-16, DS2, cenários C2, A2, A3 do ATAM.

**Arquivos e classes.** `rules/motor/motor-regras.ts` (`avaliar`, `aplicarAcoes`, `preverAcoes`),
`simulations/executor-com-limite.ts` (`ExecutorComLimite`), `simulations/simulacao.worker.ts`,
`simulations/tarefa-simulacao.ts` (`executarTarefaSimulacao`), `simulations/simulacao.service.ts`
(`SimulacaoService`), `simulations/simulacao.repository.ts`, `simulations/simulacao.tipos.ts`
(`StatusSimulacao`, `ConfiguracaoExecutada`), `simulations/simulacao.controller.ts`,
`simulations/simulations.module.ts`, `database/migrations/0005_simulacoes.sql`; fixtures
`tests/fixtures/csv/{atendimentos,vacinacao,internacoes}.csv` e `*.gabarito.json`.

**Testes.** Unitários: `motor-regras.spec.ts` (19), `executor-com-limite.spec.ts` (9, com workers
de teste em `simulations/__testes__/`), `tarefa-simulacao.spec.ts` (3),
`simulacao.service.spec.ts` (19). Integração: `ct003-simulacao.e2e-spec.ts` (8),
`ct003-tempo-limite.e2e-spec.ts` (1).

### F08 — Extrato de auditoria somente de inserção, consulta e PDF

**Descrição.** `AuditoriaService.registrarExtrato` recebe a transação do tratamento e grava o
extrato (operação, ID técnico do usuário, instante UTC, versões de entrada e saída, conjunto e
revisão, revisões das regras, ações aplicadas, totais de linhas alteradas, removidas e afetadas,
cada linha contada uma vez) e as `alteracao_registro` (linha da versão de entrada, tipo
`ATUALIZACAO`/`REMOCAO`, regra e revisão de origem, ação, coluna, valores anterior e novo, linha
representante na remoção). Restrições `UNIQUE` garantem um extrato por simulação e por versão de
saída. Gatilhos rejeitam `UPDATE`/`DELETE`; `database/papeis.sql` cria o usuário de banco da
aplicação sem `UPDATE`/`DELETE`/`TRUNCATE` nas tabelas de auditoria e de versões. Os três perfis
consultam datasets auditados (inclusive excluídos), extratos por dataset, o detalhe com
alterações paginadas e exportam o PDF (PDFKit) gerado do mesmo `ExtratoDto` da consulta. Não há
rotas de edição ou remoção. Extrato inexistente retorna mensagem genérica de indisponibilidade.

**Requisitos atendidos.** RF006 (CA006/CT006), UC-05, UC-06 (fluxos 2a, 2b, 5a), RN03, RN04,
ADR-004 (participação na transação), ADR-006 (usuário de banco sem UPDATE/DELETE, gatilho),
ADR-007 (PDF a partir do DTO), MOD-02, MOD-08, D04, cenário A5.

**Arquivos e classes.** `audit/auditoria.service.ts` (`AuditoriaService`),
`audit/auditoria.repository.ts`, `audit/auditoria.controller.ts`, `audit/auditoria.tipos.ts`
(`ExtratoDto`), `diagnostics/exportacao/exportacao.service.ts` (`exportarExtratoPdf`),
`diagnostics/exportacao/pdf-utilitarios.ts`, `database/migrations/0006_auditoria.sql`,
`database/papeis.sql`.

**Testes.** Unitários: `auditoria.service.spec.ts` (7), `exportacao.service.spec.ts` (2).
Integração: `ct006-auditoria.e2e-spec.ts` (8, incluindo conexão real com o papel
`dataqualisus_app` e erro `42501` em `UPDATE`/`DELETE`/`TRUNCATE`).

### F09 — Aplicação transacional do tratamento

**Descrição.** `POST /tratamentos` exige `confirmado: true` (400 caso contrário). Dentro de uma
única transação: (1) `SELECT ... FOR UPDATE` da simulação e verificação de vigência sob o bloqueio
(concluída, dataset ativo, conjunto ativo na mesma revisão; já aplicada → 409
`SIMULACAO_JA_APLICADA`); sem alterações previstas → 422 `SEM_ALTERACOES`, sem versão; (2) leitura
da versão de entrada com conferência do SHA-256, aplicação das ações da configuração executada na
ordem, sobre cópia, e conferência dos totais com a prévia (divergência → 409); gravação do arquivo
da nova versão endereçado pelo hash; (3) inserção da versão derivada (origem `TRATAMENTO`,
predecessora = entrada), do extrato, das alterações e mudança da simulação para `CONSOLIDADA`;
(4) `COMMIT`. Qualquer falha faz `ROLLBACK` integral; o arquivo eventualmente gravado fica sem
referência e é coletável. A resposta traz os IDs da nova versão e do extrato.

**Requisitos atendidos.** RF004 (CA004/CT004), UC-04 (fluxos 1a, 3a, 4a, 5a), RN02 (sem inferência
nem substituição de códigos), RN03, RN04, RNF001/CTN001 (falhas na persistência da versão e do
extrato), ADR-004, ADR-005, MOD-05, DS2, cenários C1, A1, A2 e risco RA01 do ATAM.

**Arquivos e classes.** `treatments/tratamento.service.ts` (`TratamentoService`,
`ResultadoTratamento`), `treatments/tratamento.controller.ts`, `treatments/treatments.module.ts`;
usa `VersionamentoService`, `AuditoriaService`, `SimulacaoRepository.consolidar`,
`SimulacaoService.validarVigencia` e `aplicarAcoes`.

**Testes.** Unitários: `tratamento.service.spec.ts` (9). Integração: `ct004-tratamento.e2e-spec.ts`
(13: conteúdo da nova versão, original intacto por SHA-256, um extrato com os campos da RN03,
reaplicação, três confirmações concorrentes → uma 201 e duas 409, invalidação por edição de regra,
dataset excluído, sem alterações, falhas injetadas em quatro etapas com rollback integral e
nova aplicação bem-sucedida depois, coleta de órfãos sem apagar versões válidas).

### F10 — Diagnóstico de qualidade e exportação PDF/XLSX

**Descrição.** `GET /diagnosticos/versoes/:versaoId` usa a avaliação mais recente da própria
versão. Sem avaliação → 404 `SEM_AVALIACAO` com orientação para executar a simulação; avaliação
invalidada ou com revisão de conjunto diferente da atual → 409 `AVALIACAO_DESATUALIZADA`. O
`calcularIndicadores` devolve sempre três indicadores na ordem unicidade, completude e validade:
percentual = 100 × linhas aprovadas em todas as regras da dimensão ÷ total de linhas da versão,
com duas casas decimais; a linha violadora conta uma vez por dimensão; dimensão sem regra fica
`NAO_AVALIADA` sem percentual. O DTO traz dataset, versão e hash, conjunto e revisão, simulação,
instante da avaliação, total de linhas, numerador, denominador, linhas com violação, regras e
colunas, cobertura (0–3, `PARCIAL`/`COMPLETA`) e o aviso de que os indicadores não certificam a
adequação clínica. O diagnóstico é materializado em `diagnostico`/`indicador` uma vez por
avaliação. A exportação (`?formato=PDF|XLSX`) usa o mesmo DTO; no XLSX (ExcelJS) todas as células
são texto com formato `@` e nenhuma recebe fórmula, mesmo que comece por `=`, `+`, `-` ou `@`.
`GET /diagnosticos/versoes` lista versões de datasets ativos para o gestor escolher.

**Requisitos atendidos.** RF005 (CA005/CT005), UC-07 (fluxos 2a, 3a, 5a), US05, US06, RN01, RN02
(códigos compõem a validade, sem cartão próprio), RNF005/CTN005, ADR-007, MOD-14, DS3, cenários A4,
A6 e C5, risco RA05.

**Arquivos e classes.** `diagnostics/calculo-indicadores.ts` (`calcularIndicadores`, `cobertura`,
`arredondarPercentual`), `diagnostics/diagnostico.service.ts` (`DiagnosticoService`),
`diagnostics/diagnostico.repository.ts`, `diagnostics/diagnostico.controller.ts`,
`diagnostics/diagnostico.tipos.ts` (`DiagnosticoDto`, `IndicadorDto`, `SituacaoIndicador`),
`diagnostics/exportacao/exportacao.service.ts` (`exportarDiagnostico`), `database/migrations/0007_diagnosticos.sql`.

**Testes.** Unitários: `calculo-indicadores.spec.ts` (15), `diagnostico.service.spec.ts` (6),
`exportacao-diagnostico.spec.ts` (2, reabre o XLSX e confere tipo e ausência de fórmula). Integração:
`ct005-diagnostico.e2e-spec.ts` (8).

---

## 4. Decisões técnicas e arquiteturais

| ID | Decisão | Justificativa | Fonte |
|----|---------|---------------|-------|
| DT01 | NestJS 11 + TypeScript estrito, PostgreSQL 16, `csv-parse`, `bcrypt`, `PDFKit`, `ExcelJS` | Pilha aceita | ADR-001 |
| DT02 | Driver `pg` com SQL parametrizado, sem ORM | ADR-006 exige consultas parametrizadas; a sequência da ADR-004 (`FOR UPDATE`, gatilhos, privilégios por tabela) é expressa diretamente em SQL; nenhuma ferramenta de ORM é citada nos documentos | ADR-004, ADR-006 |
| DT03 | Migrações SQL versionadas em `/database/migrations` com migrador próprio | P3 6.1 reserva `/database` para scripts e migrações; evita dependência adicional | P3 6.1 |
| DT04 | Guard global com negação por padrão e matriz em arquivo único | Mitiga "rota sem guarda" (ATAM C3/RA03); a matriz fica auditável e testável | ADR-006, P3 3.2 |
| DT05 | Token de sessão aleatório guardado como SHA-256; CSRF por token sincronizado na sessão | Vazamento do banco não revela sessões; atende cookie + CSRF da ADR-006 | ADR-006 |
| DT06 | CSV validado em memória (limite de 10 MB) com `csv-parse` em fluxo; arquivo gravado só depois da validação | Rejeição sem persistência parcial; tamanho limitado pela seção 8.3 | RF001, ADR-003 |
| DT07 | Arquivo nomeado `<sha256>.csv`, escrita temporária + renomeação, modo somente leitura, reaproveitamento de conteúdo idêntico | Imutabilidade e conferência por hash; nome do usuário nunca vira caminho | ADR-003, RNF005 |
| DT08 | Dataset e versão 1 na mesma transação; arquivo órfão coletado por script com carência | Mesmo desenho da ADR-004 para a importação (DA02) | ADR-003/004, DA02 |
| DT09 | Tipos declarados na configuração de cada regra (por coluna), com consistência exigida dentro do conjunto | RF002 inclui "tipos" na configuração da regra; permite reutilizar regras entre datasets (RNF002) sem tabela por dataset | RF002, RNF002, ADR-003 |
| DT10 | Registro de operadores com função de avaliação e registro de ações com transformação | Extensão restrita ao módulo de regras (CTN006) | ADR-002, RNF006 |
| DT11 | Regras e conjuntos com tabela de revisões imutáveis; edição de regra propaga nova revisão aos conjuntos ativos | Simulações e extratos referenciam a revisão realmente executada | ADR-005, MOD-12, MOD-16 |
| DT12 | Observador de revisão (`NotificadorRevisaoConjunto`) para invalidar simulações | Evita dependência do módulo de regras sobre o de simulações | P2 C4 nível 3 |
| DT13 | Pool de `worker_threads` com cronômetro desde o aceite e `terminate` no limite; limite configurável (`SIMULACAO_LIMITE_MS`) | ADR-008; a configuração permite ensaiar o timeout de forma determinística | ADR-008, RF003 |
| DT14 | Fila interna em memória (sem Redis/BullMQ) | Fila externa adiada na própria ADR-008 (DA01) | ADR-008, DA01 |
| DT15 | Tratamento recalcula as ações a partir da configuração executada e confere os totais com a prévia | Garante que o aplicado é o que foi simulado; o motor é determinístico | RF004, MOD-05 |
| DT16 | `UNIQUE (simulacao_id)` e `UNIQUE (versao_saida_id)` no extrato além do `FOR UPDATE` | Defesa adicional contra dupla aplicação no próprio banco | ADR-004, A1 |
| DT17 | Diagnóstico calculado a partir de `resultado_regra` e materializado uma vez por avaliação | Mesmo DTO para tela e exportação; cálculo reprodutível | ADR-007, MOD-14 |
| DT18 | XLSX com todas as células como texto (`numFmt '@'`) | Valores de origem nunca viram fórmula; trade-off aceito no ATAM C5 | ADR-007, RNF005 |
| DT19 | PDFs gerados em memória, sem compressão de conteúdo | Sem arquivos temporários; arquivos pequenos e inspecionáveis nos testes | ADR-007 |
| DT20 | Erros com código estável e mensagem em português; erro inesperado sem pilha nem dados | Mensagens claras para a SPA (RNF004) e logs sem dados sensíveis | ADR-006 |
| DT21 | Testes de integração em `/tests` com PostgreSQL 16 real e aplicação completa | P3 6.1 reserva `/tests` para CT/CTN e fixtures | P3 6.1 |
| DT22 | Commits por funcionalidade no padrão Conventional Commits em português | P3 6.3 | P3 6.3 |

---

## 5. Tecnologias, bibliotecas e dependências

Dependências de execução (versões exatas em `backend/package.json` e `package-lock.json`):

| Pacote | Versão | Uso |
|--------|--------|-----|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | 11.1.6 | Framework da API (ADR-001) |
| `@nestjs/config` | 4.0.2 | Leitura do `.env` |
| `pg` | 8.16.3 | Acesso ao PostgreSQL 16 |
| `csv-parse` | 6.1.0 | Leitura de CSV em fluxo (ADR-001) |
| `bcrypt` | 6.0.0 | Hash de senhas com salt (ADR-001/006) |
| `pdfkit` | 0.17.2 | PDF de diagnóstico e extrato (ADR-001/007) |
| `exceljs` | 4.4.0 | XLSX do diagnóstico (ADR-001/007) |
| `class-validator`, `class-transformer` | 0.14.2, 0.5.1 | Validação de DTOs no servidor (ADR-006) |
| `cookie-parser` | 1.4.7 | Leitura do cookie de sessão |
| `dotenv` | 16.4.7 | Variáveis de ambiente nos scripts de CLI |
| `reflect-metadata`, `rxjs` | 0.2.2, 7.8.2 | Requisitos do NestJS |
| `multer` (via `@nestjs/platform-express`) | — | Upload multipart em memória |

Desenvolvimento: TypeScript 5.9.2, Jest 29.7.0, ts-jest 29.4.1, Supertest 7.1.4, ts-node 10.9.2,
ESLint 9.35.0 com typescript-eslint 8.43.0, Prettier 3.6.2, @nestjs/cli 11.0.10, @nestjs/testing 11.1.6.
Infraestrutura: Docker com `postgres:16-alpine` (`docker-compose.yml`), GitHub Actions
(`.github/workflows/backend.yml`, Node.js 22).

---

## 6. Integrações e fluxo de funcionamento

1. **Entrada (F01/F02).** A SPA chama `POST /api/auth/entrar`; recebe o cookie de sessão e o
   `csrfToken`. Cada requisição seguinte passa pelo `AutorizacaoGuard` (sessão → CSRF → matriz).
2. **Importação (F03/F04).** `POST /api/datasets` → `ValidadorCsv` → `ArmazenamentoArquivosService.gravar`
   → transação `dataset` + `versao_dataset` (v1). Novas versões por `POST /datasets/:id/versoes`.
3. **Configuração (F05/F06).** `GET /api/vocabularios` e `GET /api/catalogo` alimentam a T03;
   `POST /api/regras` → `RegraService.validarParametros` (registro de operadores/ações +
   `VocabularioService.disponiveis`) → `regra` + `regra_revisao`; `POST /api/conjuntos` →
   `ConjuntoService` (validação do conjunto) → `conjunto_regras` + `conjunto_revisao`;
   `PUT /api/conjuntos/:id/datasets/:datasetId` → checagem de colunas → `conjunto_dataset`.
4. **Simulação (F07).** `POST /api/simulacoes` → validações → `simulacao` (`EM_EXECUCAO`,
   configuração executada) → 202 → `ExecutorComLimite` → worker (`executarTarefaSimulacao`:
   SHA-256, `lerCsv`, `avaliar`, `preverAcoes`) → `resultado_regra` + `CONCLUIDA`, ou
   `TEMPO_ESGOTADO`/`FALHA`. A SPA consulta `GET /api/simulacoes/:id`.
5. **Tratamento (F09 + F08).** `POST /api/tratamentos` → transação: `FOR UPDATE` da simulação →
   `validarVigencia` → `aplicarAcoes` → `VersionamentoService.gravarArquivo` →
   `criarVersaoDerivada` → `AuditoriaService.registrarExtrato` → `consolidar` → `COMMIT`.
6. **Diagnóstico (F10).** `GET /api/diagnosticos/versoes/:versaoId` → avaliação mais recente →
   checagem de revisão → `calcularIndicadores` → DTO; exportação PDF/XLSX pelo `ExportacaoService`.
7. **Auditoria (F08).** `GET /api/auditoria/...` para os três perfis; PDF pelo `ExportacaoService`.
8. **Revisão de regras.** `PUT /api/regras/:id` ou `PUT /api/conjuntos/:id` → novas revisões →
   `NotificadorRevisaoConjunto` → simulações `CONCLUIDA` viram `INVALIDADA` na mesma transação.

---

## 7. Testes

### 7.1 Testes unitários (`backend/src/**/*.spec.ts`, sem banco)

29 suítes, 319 casos. Distribuição por funcionalidade:

| Funcionalidade | Arquivos | Casos |
|----------------|----------|-------|
| Base | `config/configuracao.spec.ts` | 4 |
| F01 | `auth/autenticacao.service.spec.ts`, `auth/senha.service.spec.ts` | 14 |
| F02 | `auth/autorizacao.guard.spec.ts`, `auth/matriz-permissoes.spec.ts` | 15 |
| F03 | `datasets/validador-csv.spec.ts`, `datasets/armazenamento-arquivos.service.spec.ts`, `datasets/leitor-csv.spec.ts`, `datasets/dataset.service.spec.ts` | 42 |
| F04 | `datasets/dataset-manutencao.spec.ts` | 13 |
| F05 | `rules/vocabularios/importador-vocabulario.spec.ts`, `rules/vocabularios/vocabulario.service.spec.ts` | 15 |
| F06 | `rules/motor/conversao.spec.ts`, `registro-operadores.spec.ts`, `registro-acoes.spec.ts`, `validacao-configuracao.spec.ts`, `extensao-operador.spec.ts`, `rules/regra.service.spec.ts`, `rules/conjunto.service.spec.ts` | 125 |
| F07 | `rules/motor/motor-regras.spec.ts`, `simulations/executor-com-limite.spec.ts`, `simulations/tarefa-simulacao.spec.ts`, `simulations/simulacao.service.spec.ts` | 50 |
| F08 | `audit/auditoria.service.spec.ts`, `diagnostics/exportacao/exportacao.service.spec.ts` | 9 |
| F09 | `treatments/tratamento.service.spec.ts` | 9 |
| F10 | `diagnostics/calculo-indicadores.spec.ts`, `diagnostics/diagnostico.service.spec.ts`, `diagnostics/exportacao/exportacao-diagnostico.spec.ts` | 23 |

Os casos cobrem fluxos de sucesso, rejeições com o campo apontado, limites exatos e excedidos,
erros de conversão, campos vazios e marcadores, combinações E/OU, ordem das ações, contagem por
linha, invalidação, timeout no worker e na fila, falha de worker e de memória (mensagem), rollback
por falha propagada e inércia das células do XLSX.

### 7.2 Testes de integração (`tests/integracao/*.e2e-spec.ts`)

Executam a aplicação completa (mesmos módulos, pipes, filtros e guard) com Supertest contra
PostgreSQL 16 real; o banco `dataqualisus_teste` é recriado e migrado a cada execução
(`suporte/preparar-banco.ts`), e cada arquivo esvazia as tabelas no início.

| Arquivo | Caso previsto | Casos | Principais verificações |
|---------|---------------|-------|-------------------------|
| `ct007-autenticacao.e2e-spec.ts` | CT007, CTN003 (senhas) | 10 | Login dos três perfis, atributos do cookie, mensagem genérica, sessão forjada/expirada, logout, hashes distintos para senha igual |
| `ctn003-autorizacao.e2e-spec.ts` | CTN003 | 8 | Todas as rotas descobertas: sem sessão (401), após logout (401), perfil vedado (403); CSRF |
| `ct001-importacao.e2e-spec.ts` | CT001, CTN001, CTN005 | 17 | Original byte a byte, 10.000.000 bytes aceito e +1 recusado, nove rejeições sem persistência, falha injetada sem dataset parcial, `../`, SQL e HTML como dado |
| `ct001-manutencao.e2e-spec.ts` | CT001 | 8 | Listagem, registros paginados, metadados sem nova versão, nova versão vinculada, gatilho de imutabilidade, exclusão lógica |
| `ct002-vocabularios.e2e-spec.ts` | CT002 (RN02) | 4 | Importação versionada, versões lado a lado, TUSS e licença ausente recusados |
| `ct002-regras.e2e-spec.ts` | CT002 | 16 | Uma regra de cada dimensão, oito rejeições, conjunto com ordem e revisões, propagação de revisão, conflitos, coluna inexistente, exclusão lógica |
| `ct003-simulacao.e2e-spec.ts` | CT003, CTN002 | 8 | Três CSVs de estruturas distintas: pares linha/regra idênticos ao gabarito, totais, prévia, SHA-256, nenhuma versão/extrato; invalidação; recusas |
| `ct003-tempo-limite.e2e-spec.ts` | CT003, CTN001 (timeout) | 1 | `TEMPO_ESGOTADO`, aplicação desabilitada, nada persistido |
| `ct004-tratamento.e2e-spec.ts` | CT004, CT006, CTN001 | 13 | Ver F09 |
| `ct005-diagnostico.e2e-spec.ts` | CT005, CTN005 | 8 | Indicadores iguais ao cálculo manual nos três gabaritos, PDF/XLSX equivalentes, células inertes, versão tratada sem herança, avaliação desatualizada |
| `ct006-auditoria.e2e-spec.ts` | CT006 | 8 | Três perfis consultam e exportam, sem rotas de edição, gatilho, papel do banco sem privilégios (42501), dataset excluído |
| `fluxo-ponta-a-ponta.e2e-spec.ts` | Demonstração (OBJ05) | 1 | Importar → configurar → simular → aplicar → diagnosticar → auditar → sair, com os três perfis |

Os gabaritos em `tests/fixtures/csv/*.gabarito.json` foram rotulados manualmente por linha e regra,
com observações para os casos de fronteira. A comparação é feita sobre o conjunto exato de pares
`linha:regra`, pois um total correto pode ocultar erros opostos (P1, seção 11 da base).

### 7.3 Cobertura

Cobertura de linhas medida pelo Jest/Istanbul em 22/11/2026:

| Módulo | Unitários | Integração |
|--------|-----------|------------|
| auth | 77,3% | 99,4% |
| datasets | 75,8% | 93,8% |
| rules (serviços) | 53,1% | 93,3% |
| rules/motor | 95,2% | 67,2%* |
| rules/vocabularios | 68,5% | 93,8% |
| simulations | 73,4% | 88,4% |
| treatments | 79,7% | 94,7% |
| audit | 47,9% | 97,5% |
| diagnostics | 66,0% | 97,1% |
| diagnostics/exportacao | 99,2% | 98,5% |
| **Total** | **73,16% linhas, 56,83% ramos** | **88,93% linhas, 68,22% ramos** |

\* Na integração o motor roda dentro do worker thread, onde o Istanbul não coleta cobertura; o
motor é coberto pelos testes unitários (95,2%). Repositórios e controladores são exercitados pelos
testes de integração, o que explica a diferença entre as colunas.

---

## 8. Integração contínua

`.github/workflows/backend.yml` executa, em `push` para `main` e em pull requests: `npm ci`,
`format:check`, `lint`, `typecheck`, `build`, testes unitários e testes de integração com serviço
PostgreSQL 16. O resultado no GitHub **não foi verificado** nesta sessão (ver P05).

---

## 9. Resultados reais da execução

Ambiente: Linux x86_64 (18 núcleos), Node.js v24.13.0 (o projeto exige Node.js ≥ 22; a ADR-001
fixa Node.js 22 LTS, usado no CI), TypeScript 5.9.2, PostgreSQL 16.16 (`postgres:16-alpine`).

| Verificação | Comando (em `backend/`) | Resultado |
|-------------|-------------------------|-----------|
| Formatação | `npm run format:check` | Todos os arquivos no padrão Prettier |
| Análise estática | `npm run lint` | 0 erros, 0 avisos (src/ e tests/) |
| Tipos | `npm run typecheck` | Sem erros (modo `strict`) |
| Compilação | `npm run build` | Concluída; `dist/simulations/simulacao.worker.js` gerado |
| Testes unitários | `npm test` | 29/29 suítes, **319/319 casos aprovados**, 0 falhas, ~2,9 s |
| Testes de integração | `npm run test:integracao` | 12/12 suítes, **102/102 casos aprovados**, 0 falhas, ~16,8 s |
| Migrações em banco novo | `npm run db:migrar` | 0001 a 0007 aplicadas |
| Papel do banco | `psql ... -f ../database/papeis.sql` | Executado sem erros |
| Contas de demonstração | `npm run db:seed` | Três contas provisionadas |

**Execução da API compilada.** `node dist/main.js` foi iniciado com `NODE_ENV=production`,
conectado ao banco como `dataqualisus_app` (usuário restrito), e exercitado por um script HTTP.
Resultados obtidos: saúde 200 com banco disponível; login do analista 200; importação 201 (3
registros); regras, conjunto e associação 201/201/201/200; simulação aceita com 202 e
`CONCLUIDA` executada pelo worker compilado (`[[2],[]]`); tratamento 201 (versão 2, 1 linha
alterada, 1 removida); reaplicação 409 `SIMULACAO_JA_APLICADA`; diagnóstico 200
(unicidade 66,67%, completude 100%, validade "Não avaliada"); XLSX 200 (8.121 bytes); PDF do
extrato 200 (7.822 bytes); logout 204 e acesso seguinte 401. O log da API não continha nenhuma das
senhas usadas (busca com resultado 0).

**Desempenho no limite.** Com um CSV de 9.977.962 bytes e 100.000 registros (48 colunas), a
validação levou 534 ms e a simulação no worker compilado (unicidade com remoção, completude de 5
colunas com ação e validade com 5 condições com ação) levou 852 ms, abaixo do limite de 60 s.
Observação: 100 colunas e 100.000 registros simultâneos não cabem em 10.000.000 bytes (cada linha
precisaria de no máximo 100 bytes), então o pior caso de volume é limitado pelos bytes. Medição
única, sem repetição estatística.

---

## 10. Limitações, pendências e ambiguidades

### 10.1 Ambiguidades resolvidas por decisão documentada

| ID | Ponto | Decisão adotada | Arquivos |
|----|-------|-----------------|----------|
| A01 | Não há lista explícita das "10 funcionalidades" | Decomposição da seção 1.2 (C4 nível 3 + PB01–PB07 + P3 F1–F6) | — |
| A02 | A tabela de componentes da P2 cita `verificarArgon2id`, mas ADR-006, UC-08 e DS4 citam bcrypt | bcrypt (decisão aceita na ADR-006/ADR-001) | `auth/senha.service.ts` |
| A03 | Valores de `StatusSimulacao` não legíveis no texto (só `TEMPO_ESGOTADO` e `CONSOLIDADA`) | `EM_EXECUCAO`, `CONCLUIDA`, `TEMPO_ESGOTADO`, `FALHA`, `INVALIDADA`, `CONSOLIDADA` | `simulations/simulacao.tipos.ts`, `0005_simulacoes.sql` |
| A04 | Onde declarar os tipos das colunas | Na configuração da regra, coerente dentro do conjunto (DT09) | `rules/motor/validacao-configuracao.ts` |
| A05 | Unicidade com chave vazia | Chave com alguma coluna vazia não participa da unicidade; a ausência é medida pela completude, se configurada | `rules/motor/motor-regras.ts` (`chaveDe`) |
| A06 | Comparação de chave e de texto | Comparação literal do texto (sem aparar nem ignorar caixa); decimal e data desconsideram espaços nas extremidades na conversão | `motor-regras.ts`, `conversao.ts` |
| A07 | Marcadores de ausência | Comparados literalmente após aparar espaços; `sem info` ≠ `SEM INFO` | `motor-regras.ts` |
| A08 | Quais ações se associam a quais dimensões | Remoção de repetições só em unicidade (chave da própria regra); demais ações em completude/validade, sobre coluna da própria regra; aparar e caixa só em texto | `registro-acoes.ts`, `validacao-configuracao.ts` |
| A09 | "Até cinco condições" em completude | Cada coluna da regra de completude conta como condição (máx. 5); chave de unicidade até 100 colunas | `validacao-configuracao.ts` |
| A10 | Simular conjunto não associado | Exige associação conjunto ↔ dataset (422 `CONJUNTO_NAO_ASSOCIADO`) | `simulacao.service.ts` |
| A11 | Qual avaliação alimenta o diagnóstico | A mais recente da versão; se estiver invalidada ou com revisão diferente, 409 e orientação para nova simulação | `diagnostico.service.ts` |
| A12 | Exclusão de regra usada em conjunto | Bloqueada (409) até a regra sair dos conjuntos ativos | `regra.service.ts` |
| A13 | Como gestor e equipe técnica selecionam dataset/versão sem RF001 | Rotas somente leitura `GET /diagnosticos/versoes` e `GET /auditoria/datasets` | `diagnostico.controller.ts`, `auditoria.controller.ts` |
| A14 | Linhas vazias no CSV | Quebras de linha no fim do arquivo são ignoradas; linha vazia no meio é estrutura inconsistente; caractere nulo é recusado | `validador-csv.ts` |
| A15 | Números no XLSX | Escritos como texto, como os demais valores (DT18) | `exportacao.service.ts` |
| A16 | Tamanho do PDF do extrato | Detalha as primeiras 1.000 alterações e informa quantas faltam; a consulta paginada mostra todas | `exportacao.service.ts` (`LIMITE_ALTERACOES_PDF`) |
| A17 | Espera em fila consome o prazo de 60 s | Mantido conforme a P1 (contagem desde o aceite); risco já registrado no ATAM (C2/RA02) | `executor-com-limite.ts` |

### 10.2 Pendências e limitações

| ID | Pendência | Impacto | Arquivos envolvidos |
|----|-----------|---------|---------------------|
| P01 | **Arquivo oficial CID-10** (Q01): não foi obtido. Os testes usam `tests/fixtures/vocabularios/cid10-amostra-teste.csv`, amostra sintética de 25 códigos que não substitui a lista oficial | Validade de códigos clínicos com dados reais não verificada; a importação está pronta para o arquivo oficial | `cli/importar-vocabulario.ts`, `rules/vocabularios/` |
| P02 | **Frontend (SPA React)** fora do escopo | CTN004 (walkthrough de usabilidade) e CTN007 (Chromium/Firefox, 1366 × 768) não podem ser executados; OBJ05 depende da interface | — |
| P03 | **CTN006 formal** (operador novo em branch de teste com regressão documentada) não foi conduzido como ensaio da equipe | Há evidência automatizada do ponto de extensão (`extensao-operador.spec.ts`) e a regressão CT001–CT007 está automatizada, mas o ensaio em branch segue pendente | `rules/motor/registro-operadores.ts` |
| P04 | Teste de desempenho com repetição e carga concorrente | Medição única (852 ms); capacidade do pool sob várias simulações simultâneas não medida (DA01) | `executor-com-limite.ts` |
| P05 | Execução do pipeline no GitHub Actions não verificada (CLI `gh` indisponível nesta sessão) | O workflow repete os comandos validados localmente, mas o resultado remoto precisa ser conferido | `.github/workflows/backend.yml` |
| P06 | Coleta de arquivos órfãos é manual (script), sem agendamento | Arquivos sem referência permanecem até a execução do script (DA02) | `cli/coletar-orfaos.ts` |
| P07 | Sessões expiradas não são removidas da tabela `sessao` | Crescimento da tabela; não afeta a segurança (sessão expirada é recusada) | `auth/sessao.repository.ts` |
| P08 | Limitação de tentativas de login não especificada nos documentos e não implementada | Força bruta depende de controles de infraestrutura | `auth/autenticacao.service.ts` |
| P09 | Trilha de auditoria cobre apenas o tratamento (RN03); importação, exclusão lógica e edição de regras ficam registradas nas próprias tabelas (autor e instante), não em extrato | Conforme RF006, que define extrato por tratamento | — |
| P10 | O tratamento recalcula as ações na thread principal (não no worker) | Para arquivos no limite, o recálculo bloqueia a API por cerca de 1 s; a ADR-008 trata apenas da simulação | `treatments/tratamento.service.ts` |
| P11 | Execução local em Node.js 24 (o CI usa Node.js 22 LTS, conforme ADR-001) | Compatibilidade com Node.js 22 depende da verificação do CI (P05) | `backend/package.json` (`engines`) |
| P12 | Restrição e documentação do acesso administrativo ao banco (Q04) | `papeis.sql` separa o usuário da aplicação do dono do esquema; a política administrativa da infraestrutura é procedimento da equipe | `database/papeis.sql`, `database/README.md` |
| P13 | Datasets reais abertos e verificação de ausência de dados pessoais (D01, Q01) | Os testes usam apenas dados sintéticos rotulados; resultados não se generalizam para dados reais (OBJ06) | `tests/fixtures/` |

---

## 11. Matriz de rastreabilidade

| Funcionalidade | Requisitos | Decisões | Código principal | Testes | Commit |
|----------------|-----------|----------|------------------|--------|--------|
| F01 | RF007, RNF003, UC-08, D05 | ADR-006, DT05 | `backend/src/auth/autenticacao.service.ts` | `ct007-autenticacao`, `autenticacao.service.spec` | `769789c` |
| F02 | RF007, RNF003, RNF005 | ADR-006, DT04 | `backend/src/auth/autorizacao.guard.ts`, `matriz-permissoes.ts` | `ctn003-autorizacao`, `autorizacao.guard.spec` | `84d6688` |
| F03 | RF001, RN04, RNF001, RNF005 | ADR-003, ADR-004, DT06–DT08 | `backend/src/datasets/validador-csv.ts`, `armazenamento-arquivos.service.ts` | `ct001-importacao`, `validador-csv.spec` | `19c4adc` |
| F04 | RF001, RN04 | ADR-005, MOD-15 | `backend/src/datasets/dataset.service.ts` | `ct001-manutencao`, `dataset-manutencao.spec` | `c96a4f9` |
| F05 | RN02, D06 | ADR-009, MOD-13 | `backend/src/rules/vocabularios/` | `ct002-vocabularios`, `importador-vocabulario.spec` | `bb4caf9` |
| F06 | RF002, RN01, RN02, RNF006 | ADR-002, ADR-005, DT09–DT12 | `backend/src/rules/motor/`, `regra.service.ts`, `conjunto.service.ts` | `ct002-regras`, `validacao-configuracao.spec` | `a646b7c` |
| F07 | RF003, RN01, RN02, RN04, RNF001, RNF002 | ADR-008, MOD-12, MOD-16, DT13–DT14 | `backend/src/simulations/`, `rules/motor/motor-regras.ts` | `ct003-simulacao`, `ct003-tempo-limite`, `motor-regras.spec` | `966b95c` |
| F08 | RF006, RN03, RN04 | ADR-004, ADR-006, ADR-007, DT16 | `backend/src/audit/`, `database/papeis.sql` | `ct006-auditoria`, `auditoria.service.spec` | `6ab5219` |
| F09 | RF004, RN02, RN03, RN04, RNF001 | ADR-004, ADR-005, DT15–DT16 | `backend/src/treatments/tratamento.service.ts` | `ct004-tratamento`, `tratamento.service.spec` | `f372244` |
| F10 | RF005, RN01, RN02, RNF005 | ADR-007, MOD-14, DT17–DT18 | `backend/src/diagnostics/` | `ct005-diagnostico`, `calculo-indicadores.spec` | `326fafb` |

Cobertura dos RNF: RNF001 (CTN001 em `ct001-importacao`, `ct003-tempo-limite`, `ct004-tratamento`),
RNF002 (CTN002 em `ct003-simulacao`), RNF003 (CTN003 em `ctn003-autorizacao` e `ct007-autenticacao`),
RNF005 (CTN005 em `ct001-importacao` e `ct005-diagnostico`), RNF006 (evidência parcial em
`extensao-operador.spec`); RNF004 e RNF007 dependem da interface (P02).

---

## 12. Histórico de commits (branch `main`)

| Commit | Mensagem |
|--------|----------|
| `4a3746d` | chore(backend): criada estrutura base da API NestJS |
| `769789c` | feat(auth): adicionada autenticação com sessão no servidor (F01) |
| `84d6688` | feat(auth): adicionada autorização por perfil e proteção CSRF (F02) |
| `19c4adc` | feat(datasets): adicionada importação de CSV com armazenamento imutável (F03) |
| `c96a4f9` | feat(datasets): adicionada manutenção de datasets com versões e exclusão lógica (F04) |
| `bb4caf9` | feat(rules): adicionados vocabulários oficiais versionados (F05) |
| `a646b7c` | feat(rules): adicionadas regras visuais e conjuntos com revisões (F06) |
| `966b95c` | feat(simulations): adicionada simulação com limite de tempo em workers (F07) |
| `6ab5219` | feat(audit): adicionado extrato de auditoria somente de inserção com PDF (F08) |
| `f372244` | feat(treatments): adicionada aplicação transacional do tratamento (F09) |
| `326fafb` | feat(diagnostics): adicionado diagnóstico com três indicadores e exportação (F10) |
| `feec35f` | test: adicionados fluxo ponta a ponta e evidência de extensão do catálogo |
| `97bbd0c` | ci: adicionado pipeline do backend com PostgreSQL 16 |

Cada commit de funcionalidade foi validado antes do envio com formatação, lint, verificação de
tipos e as suítes unitária e de integração disponíveis até aquele ponto. O commit deste relatório e
do README segue o último da tabela.
