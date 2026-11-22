import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Catalogo, ConfiguracaoRegra, Regra, RevisaoRegra } from "@/types/rules/regra";

export interface RegraPayload {
    nome: string;
    descricao?: string;
    configuracao: ConfiguracaoRegra;
}

export function obterCatalogo(): Promise<Catalogo> {
    return apiGet<Catalogo>("/catalogo");
}

export function listarRegras(): Promise<Regra[]> {
    return apiGet<Regra[]>("/regras");
}

export function obterRegra(id: string): Promise<Regra> {
    return apiGet<Regra>(`/regras/${id}`);
}

export function listarRevisoesRegra(id: string): Promise<RevisaoRegra[]> {
    return apiGet<RevisaoRegra[]>(`/regras/${id}/revisoes`);
}

/** POST /regras: configuração validada pelo esquema do catálogo no servidor. */
export function criarRegra(payload: RegraPayload): Promise<Regra> {
    return apiPost<Regra>("/regras", payload);
}

/** PUT /regras/:id: cria nova revisão e revisa os conjuntos ativos que usam a regra. */
export function atualizarRegra(id: string, payload: Partial<RegraPayload>): Promise<Regra> {
    return apiPut<Regra>(`/regras/${id}`, payload);
}

export function excluirRegra(id: string): Promise<Regra> {
    return apiDelete<Regra>(`/regras/${id}`);
}
