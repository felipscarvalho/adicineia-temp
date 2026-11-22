# Arquitetura do frontend (`front/`)

Interface web do DataQualiSUS: SPA em React 19 + TypeScript (ADR-001), compilada pelo Vite e com
rotas no navegador pelo React Router. Consome a API de `back/` e implementa as telas T00–T07 da P2. As regras de negócio, permissões e cálculos
continuam no backend (P2, visão de contêineres): o front apresenta dados e coleta comandos.

## 1. Stack

* UI base: Untitled UI React (React Aria + Tailwind CSS 4). Componentes adicionados via CLI (`npx untitledui@latest add <componente>`), que copia o código para o projeto
* HTTP: axios, encapsulado em um client único
* Dados do servidor: TanStack Query (cache, revalidação, mutations)
* Estado global do cliente: Zustand
* Identidade visual: padrão do Untitled UI, sem tema próprio. Cores, fontes (Inter) e tokens vêm de `styles/theme.css` como o CLI entrega; usar sempre os tokens semânticos (`bg-primary`, `text-secondary`, `ring-secondary`...) para funcionar nos dois modos. Superfícies seguem o padrão dos componentes: `bg-primary` com `ring-1 ring-secondary` e `shadow-xs`
* Light/dark mode: `ThemeProvider` do Untitled UI em `providers/theme-provider.tsx` (classes `light-mode`/`dark-mode`, padrão: o do sistema); alternância com `ThemeToggle` de `components/theme/theme_toggle.tsx`. O `index.html` aplica o tema salvo antes da primeira pintura
* Rotas: React Router, declaradas em `app.tsx`; `providers/router-provider.tsx` liga a navegação dos componentes do react-aria ao roteador
* Alert e toast: componentes próprios em `components/feedback/` (os do Untitled UI são PRO). Toasts sempre via `toast` de `@/components/feedback/toast`, nunca importando `sonner` diretamente
* Estilos: só classes Tailwind; não usar módulos CSS (`*.module.css`)
* Ícones: somente `@untitledui/icons` (mesma biblioteca usada internamente pelos componentes); não adicionar outras bibliotecas de ícones
* Datas: moment, sempre importado de `@/lib/moment` (já configura o locale `pt-br`); exibição no formato `DD/MM/YYYY` via `formatDate` (`formatDateTime` para instantes). Componentes do react-aria usam o locale `pt-BR` do `I18nProvider` em `main.tsx`
* Formulários: react-hook-form
* Validação: Zod (integrado ao react-hook-form via `zodResolver` de `@hookform/resolvers`)
* Testes: Vitest + Testing Library + MSW (componentes, hooks e services contra uma API simulada) e Playwright (fluxo ponta a ponta contra o backend real)

## 2. Camada de API

Fluxo: Componente → Hook (TanStack Query) → Service → API client → backend. Componentes e stores nunca chamam axios diretamente, e componentes não chamam services diretamente para buscar dados (sempre via hook).

### API client (`lib/api.ts`)

Instância única de axios, configurada uma vez:

* `baseURL` vinda de `VITE_API_URL` (padrão `/api`). Em desenvolvimento e no `vite preview`, o `vite.config.ts` encaminha `/api/*` ao backend (`API_PROXY_URL`); em produção, o nginx de `deploy/` faz o mesmo. SPA e API ficam no mesmo domínio
* Autenticação por sessão no servidor (ADR-006): o cookie `HttpOnly`/`Secure`/`SameSite=Lax` vai em todas as requisições (`withCredentials`); o interceptor de request acrescenta `X-CSRF-Token` nos métodos que alteram estado
* Interceptor de response normaliza qualquer erro em `ApiError` (`status`, `codigo`, `message`, `detalhes`/`errosDeCampo`), no formato `{ statusCode, erro, mensagem, detalhes }` do backend; em 401 limpa a sessão e volta para `/login`
* É o único arquivo do front que importa `axios`

### Services (`services/<module>/`)

Funções tipadas que representam cada endpoint, reutilizadas por toda a aplicação:

* Uma função por operação: `obterDataset(id)` → `GET /datasets/:id`
* Usam exclusivamente o API client, pelos atalhos `apiGet`, `apiPost`, `apiPut`, `apiPatch` e `apiDelete` de `lib/api.ts`, que já devolvem o `data` da resposta tipado, `apiGetPage` para listas paginadas (itens + `metadata`) e `apiDownload` para PDF/XLSX
* Módulos espelham os módulos do backend: `auth`, `datasets`, `rules`, `simulations`, `treatments`, `audit`, `diagnostics`

### Hooks de dados (`hooks/<module>/`)

Camada fina de TanStack Query sobre os services; é por ela que componentes consomem dados do backend:

* Leitura com `useQuery`, escrita com `useMutation`. `queryFn`/`mutationFn` sempre chamam um service
* Um arquivo por recurso: `hooks/datasets/use_datasets.ts`, exportando hooks como `useDatasets()`, `useDataset(id)`, `useImportarDataset()`
* Query keys centralizadas por recurso (ex.: `datasetKeys.all`, `datasetKeys.detail(id)`), nunca escritas como literal solto nos componentes
* Toda mutation invalida (`invalidateQueries`) as keys afetadas no `onSuccess`
* Cache apenas em memória, com as opções padrão; a única exceção é o `refetchInterval` da simulação em execução (a SPA consulta o estado, ADR-008)
* `QueryClientProvider` configurado uma vez em `main.tsx`

### Tipos (`types/<module>/`)

Tipos das respostas e payloads da API, espelhando os DTOs do backend.

## 3. Estado global do cliente (`stores/`)

* Zustand apenas para estado do próprio front compartilhado entre páginas/componentes
* Dados vindos do backend ficam no cache do TanStack Query, nunca copiados para stores. Exceção: o usuário autenticado, no `user_store` (`stores/user_store.ts`): dados do usuário, permissões e token CSRF, com os métodos `login`, `logout`, `revalidate`, `clear`, `can` e `canAnywhere`
* Estado local de um componente fica em `useState`; não criar store para estado usado em um só lugar
* Um store por responsabilidade: `stores/<name>_store.ts`, exportando o hook `use<Name>Store`

### Área logada e autenticação

* A sessão é o cookie HttpOnly do backend, invisível ao JavaScript; por isso o `user_store` não persiste nada no `localStorage`: a cada carga, `revalidate()` chama `GET /auth/sessao` e recupera usuário, permissões (`permissoes`, derivadas da matriz perfil × operação do backend) e token CSRF
* Páginas autenticadas são rotas filhas do `AppShell` em `app.tsx` (rota de layout com `<Outlet />`): ele revalida o usuário, redireciona sem sessão e monta a sidebar filtrada por permissão. A sidebar é dividida em seções por módulo (`components/navigation/navegacao.ts`): tela nova entra na seção do seu módulo, com a operação exigida
* Cada tela fica em `pages/<rota>/_components/<nome>_tela.tsx` (`<Nome>Tela`), lê parâmetros com `useParams` e entra em `app.tsx` com `lazy` (um pacote por rota) e o título da aba via `TituloPagina`. Detalhes de um registro ficam em `pages/<rota>/detalhe/`
* Botões e ações aparecem só com a permissão necessária (`usePermissions().can/canAnywhere`); telas inteiras usam `PermissionGate`. O backend continua sendo quem garante
* Logout usa `window.location.href` (recarga completa), para descartar o cache do TanStack Query do usuário anterior

## 4. Componentes

### Globais (`components/`)

* Componentes do Untitled UI ficam nas pastas criadas pelo CLI dentro de `components/` (`base/`, `application/`, `foundations/`, `shared-assets/`)
* Componentes próprios reutilizáveis em mais de uma página ficam em `components/`, fora das pastas do Untitled UI
* Antes de criar um componente, verificar se o Untitled UI já oferece um equivalente

### ⚠️ Componentes base são congelados

Os componentes base não podem ser modificados sem permissão direta e explícita, mesmo para correções, ajustes de estilo, refatorações ou tradução de textos. Isso vale para:

* Tudo em `components/base/`, `components/application/`, `components/foundations/` e `components/shared-assets/` (Untitled UI)
* Provedores do Untitled UI em `providers/` e componentes próprios: `components/feedback/`, `components/navigation/`, `components/brand/` e `components/theme/`
* Estilos globais: `styles/theme.css`, `styles/typography.css`, `styles/globals.css`

Se uma tarefa parecer exigir mudança nesses arquivos, parar e pedir autorização descrevendo a alteração. Telas devem usar os componentes como estão, ajustando apenas via props e `className` no local de uso. Adicionar um componente novo do Untitled UI (via CLI) também precisa de autorização.

### Componentes de tela compartilhados (não congelados)

* `components/layout/`: `PageHeader`, `Card`/`SplitCard`, `Section`/`DetailField`/`DetailTags`, `LoadingState`/`ErrorState`/`EmptyState`, `ListToolbar`, `ListContent`, `ListPagination`, `FormActions`, `PermissionGate`, `TituloPagina` e `AppShell`
* `components/forms/`: `FormInput`, `FormTextArea` e `FormSelect`, campos já ligados ao react-hook-form (valor, validação e erro no lugar da dica)
* `components/overlays/`: `FormModal` (formulário em modal) e `ConfirmModal` (confirmação de ação)
* `components/<module>/`: componentes de um módulo usados em mais de uma página (ex.: `components/rules/`, `components/datasets/`)
* `components/query_provider.tsx`: `QueryClientProvider` do TanStack Query, aplicado em `main.tsx`

### Locais (`pages/<rota>/_components/`)

* Componentes usados apenas por uma página ficam junto dela em `_components/`
* Componente local que passa a ser usado por outra página é promovido para `components/`

## 5. Formulários e validação

* Formulários com react-hook-form + Zod (`useForm({ resolver: zodResolver(schema) })`)
* Schemas compartilhados em `schemas/<module>/`; schema usado por um único formulário pode ficar junto da página
* Tipos derivados com `z.infer<typeof schema>`, sem duplicar tipo manualmente
* A validação do front é para UX; a validação de verdade continua no backend (class-validator e o esquema do catálogo de regras). Erros de campo devolvidos pela API (`detalhes`) são exibidos no formulário
* Telas de detalhe são editáveis direto: quem tem permissão já entra com os campos editáveis; um único formulário por tela, com `useEditForm` (`hooks/use_edit_form.ts`) e `FormActions` (Descartar/Salvar ativos só quando algo mudou); quem não pode editar vê a mesma estrutura só para leitura. Modais ficam para criar registros e ações pontuais (importar, confirmar)
* Sem informação repetida em cards separados: dados de uma mesma entidade ficam num card só
* Campos limpos a cada submissão: em modal, o componente exportado chama `useOpenSession(isOpen)` e renderiza o conteúdo com `key={session}`; na página, formulário que cria algo chama `reset` no `onSuccess`

## 6. Execução e verificações

```bash
cd front
npm ci
cp .env.example .env.local
npm run dev            # http://localhost:3001 (o backend deve estar em API_PROXY_URL)
npm run preview        # serve o build (dist/) em :3001, com o mesmo encaminhamento de /api
npm run lint           # ESLint (typescript-eslint e regras de hooks do React)
npm run typecheck      # TypeScript
npm test               # Vitest + Testing Library + MSW
npm run build          # build de produção em dist/ (arquivos estáticos)
npm run test:e2e       # Playwright contra back + front em execução (ver e2e/README)
```

## 7. Adaptações em relação ao padrão de referência

| Padrão de referência | Adaptação no DataQualiSUS | Motivo |
|----------------------|---------------------------|--------|
| Token Bearer no `localStorage` | Cookie de sessão HttpOnly + `X-CSRF-Token`; store sem persistência | ADR-006 (sessão no servidor, revogável no logout) |
| `NEXT_PUBLIC_API_URL` → `/api/v1` | `VITE_API_URL` = `/api`, encaminhado pelo Vite (dev) e pelo nginx (produção) | SPA compilada pelo Vite; rotas do backend usam o prefixo `/api` |
| Next.js (App Router, `page.tsx` + `instant`) | Vite + React Router, rotas em `app.tsx` e telas em `pages/` | ADR-001 define SPA em React; não há renderização no servidor |
| Validação no backend com VineJS | class-validator e validação do catálogo de regras | Pilha da ADR-001 |
| Escopos por instituição em `canAnywhere` | `canAnywhere` = alguma das operações | Não há isolamento por instituição (P1, seção 8.3) |
| `components/administration/` | Componentes por módulo (`components/datasets/`, `components/rules/`...) | Módulos do DataQualiSUS |
| Tema SimMAP (`lawd-theme.css`, glassmorphism) | Tema padrão do Untitled UI | Identidade visual padrão da biblioteca adotada pelo grupo |
| `next-themes` | `ThemeProvider` do kit Vite do Untitled UI | Sem dependência do Next |
