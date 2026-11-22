import { apiPost } from "@/lib/api";
import type { ResultadoTratamento } from "@/types/treatments";

/**
 * POST /tratamentos: aplica as ações da simulação vigente. A confirmação explícita vai no corpo;
 * nova versão e extrato são gravados juntos ou nenhum (ADR-004).
 */
export function aplicarTratamento(simulacaoId: string): Promise<ResultadoTratamento> {
    return apiPost<ResultadoTratamento>("/tratamentos", { simulacaoId, confirmado: true });
}
