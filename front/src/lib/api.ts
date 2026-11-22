import axios, { AxiosError, type AxiosRequestConfig } from "axios";

/**
 * Cliente HTTP único da SPA (é o único arquivo que importa axios).
 *
 * Adaptação à ADR-006 do backend: a sessão é um cookie HttpOnly mantido pelo servidor, então não há
 * token Bearer no front. O cliente envia o cookie (`withCredentials`) e, nos métodos que alteram
 * estado, o cabeçalho `X-CSRF-Token` recebido na entrada/revalidação da sessão.
 */
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials: true,
    headers: { Accept: "application/json" },
});

/** Erro normalizado, no mesmo formato para qualquer falha (resposta do backend, rede ou inesperada). */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly codigo: string,
        mensagem: string,
        readonly detalhes?: unknown,
    ) {
        super(mensagem);
        this.name = "ApiError";
    }

    /** Erros de campo devolvidos pelo backend em `detalhes: [{ campo, mensagem }]`. */
    get errosDeCampo(): { campo: string; mensagem: string }[] {
        return Array.isArray(this.detalhes)
            ? this.detalhes.filter((d): d is { campo: string; mensagem: string } => typeof d === "object" && d !== null && "campo" in d && "mensagem" in d)
            : [];
    }
}

interface CorpoErroBackend {
    statusCode?: number;
    erro?: string;
    mensagem?: string | string[];
    detalhes?: unknown;
}

let obterCsrf: () => string | null = () => null;
let aoPerderSessao: () => void = () => undefined;

/** Ligação com o user_store sem dependência circular entre store e cliente. */
export function configurarSessao(opcoes: { obterCsrf: () => string | null; aoPerderSessao: () => void }): void {
    obterCsrf = opcoes.obterCsrf;
    aoPerderSessao = opcoes.aoPerderSessao;
}

const METODOS_SEGUROS = new Set(["get", "head", "options"]);
const ROTAS_SEM_REDIRECIONAMENTO = ["/auth/entrar", "/auth/sessao"];

api.interceptors.request.use((config) => {
    const csrf = obterCsrf();
    if (csrf && !METODOS_SEGUROS.has((config.method ?? "get").toLowerCase())) {
        config.headers.set("X-CSRF-Token", csrf);
    }
    return config;
});

function lerTextoDoBlob(dados: Blob): Promise<string> {
    if (typeof dados.text === "function") {
        return dados.text();
    }
    return new Promise((resolver, rejeitar) => {
        const leitor = new FileReader();
        leitor.onload = () => resolver(String(leitor.result));
        leitor.onerror = () => rejeitar(leitor.error);
        leitor.readAsText(dados);
    });
}

/** Em downloads (responseType blob), o corpo de erro também chega como blob e é lido como JSON. */
async function lerCorpo(dados: unknown): Promise<CorpoErroBackend | undefined> {
    const pareceBlob = typeof dados === "object" && dados !== null && "size" in dados && "type" in dados && typeof (dados as Blob).slice === "function";
    if (pareceBlob) {
        try {
            return JSON.parse(await lerTextoDoBlob(dados as Blob)) as CorpoErroBackend;
        } catch {
            return undefined;
        }
    }
    return dados && typeof dados === "object" ? (dados as CorpoErroBackend) : undefined;
}

export async function normalizarErro(erro: unknown): Promise<ApiError> {
    if (erro instanceof ApiError) {
        return erro;
    }
    if (erro instanceof AxiosError) {
        if (!erro.response) {
            return new ApiError(0, "SEM_CONEXAO", "Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.");
        }
        const corpo = await lerCorpo(erro.response.data);
        const mensagem = Array.isArray(corpo?.mensagem) ? corpo.mensagem.join(" ") : (corpo?.mensagem ?? "Não foi possível concluir a operação.");
        return new ApiError(erro.response.status, corpo?.erro ?? "ERRO", mensagem, corpo?.detalhes);
    }
    return new ApiError(0, "ERRO_INESPERADO", "Ocorreu um erro inesperado.");
}

api.interceptors.response.use(
    (resposta) => resposta,
    async (erro: unknown) => {
        const normalizado = await normalizarErro(erro);
        const url = erro instanceof AxiosError ? (erro.config?.url ?? "") : "";
        if (normalizado.status === 401 && !ROTAS_SEM_REDIRECIONAMENTO.some((rota) => url.endsWith(rota))) {
            aoPerderSessao();
        }
        return Promise.reject(normalizado);
    },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await api.get<T>(url, config)).data;
}

export async function apiPost<T>(url: string, corpo?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await api.post<T>(url, corpo, config)).data;
}

export async function apiPut<T>(url: string, corpo?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await api.put<T>(url, corpo, config)).data;
}

export async function apiPatch<T>(url: string, corpo?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await api.patch<T>(url, corpo, config)).data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await api.delete<T>(url, config)).data;
}

/** Página de uma lista: itens + metadados de paginação. */
export interface Pagina<T> {
    itens: T[];
    metadata: { pagina: number; tamanho: number; total: number; totalPaginas: number };
}

/**
 * Listas paginadas. O backend devolve itens e total com nomes próprios de cada recurso; o extrator
 * informa onde estão, e a função monta sempre o mesmo formato `Pagina<T>`.
 */
export async function apiGetPage<T, R = unknown>(
    url: string,
    params: { pagina: number; tamanho: number },
    extrair: (resposta: R) => { itens: T[]; total: number },
): Promise<Pagina<T>> {
    const resposta = await apiGet<R>(url, { params });
    const { itens, total } = extrair(resposta);
    return {
        itens,
        metadata: { pagina: params.pagina, tamanho: params.tamanho, total, totalPaginas: Math.max(1, Math.ceil(total / params.tamanho)) },
    };
}

/** Download de arquivos (PDF/XLSX): devolve o conteúdo e o nome indicado pelo servidor. */
export async function apiDownload(url: string, nomePadrao: string): Promise<{ conteudo: Blob; nomeArquivo: string }> {
    const resposta = await api.get<Blob>(url, { responseType: "blob" });
    const disposicao = String(resposta.headers["content-disposition"] ?? "");
    const nome = /filename="?([^";]+)"?/i.exec(disposicao)?.[1] ?? nomePadrao;
    return { conteudo: resposta.data, nomeArquivo: nome };
}
