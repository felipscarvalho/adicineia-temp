import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type { Conjunto, RevisaoConjunto } from "@/types/rules/regra";

export interface ConjuntoPayload {
    nome: string;
    descricao?: string;
    /** Regras na ordem explícita de execução. */
    regras: string[];
}

export function listarConjuntos(): Promise<Conjunto[]> {
    return apiGet<Conjunto[]>("/conjuntos");
}

export function obterConjunto(id: string): Promise<Conjunto> {
    return apiGet<Conjunto>(`/conjuntos/${id}`);
}

export function listarRevisoesConjunto(id: string): Promise<RevisaoConjunto[]> {
    return apiGet<RevisaoConjunto[]>(`/conjuntos/${id}/revisoes`);
}

export function criarConjunto(payload: ConjuntoPayload): Promise<Conjunto> {
    return apiPost<Conjunto>("/conjuntos", payload);
}

export function atualizarConjunto(id: string, payload: Partial<ConjuntoPayload>): Promise<Conjunto> {
    return apiPut<Conjunto>(`/conjuntos/${id}`, payload);
}

export function excluirConjunto(id: string): Promise<Conjunto> {
    return apiDelete<Conjunto>(`/conjuntos/${id}`);
}

/** PUT /conjuntos/:id/datasets/:datasetId: rejeita colunas inexistentes no dataset. */
export function associarDataset(id: string, datasetId: string): Promise<Conjunto> {
    return apiPut<Conjunto>(`/conjuntos/${id}/datasets/${datasetId}`);
}

export function desassociarDataset(id: string, datasetId: string): Promise<Conjunto> {
    return apiDelete<Conjunto>(`/conjuntos/${id}/datasets/${datasetId}`);
}
