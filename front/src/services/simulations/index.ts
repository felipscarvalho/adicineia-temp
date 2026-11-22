import { apiGet, apiPost } from "@/lib/api";
import type { Simulacao } from "@/types/simulations";

/** POST /simulacoes (202): registra a configuração executada; o limite de 60 s conta do aceite. */
export function simular(dados: { versaoId: string; conjuntoId: string }): Promise<Simulacao> {
    return apiPost<Simulacao>("/simulacoes", dados);
}

/** GET /simulacoes/:id: estado, resultados por regra, prévia e vigência. */
export function obterSimulacao(id: string): Promise<Simulacao> {
    return apiGet<Simulacao>(`/simulacoes/${id}`);
}

export function listarSimulacoes(versaoId: string): Promise<Simulacao[]> {
    return apiGet<Simulacao[]>("/simulacoes", { params: { versaoId } });
}
