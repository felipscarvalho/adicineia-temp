import { apiDownload, apiGet } from "@/lib/api";
import type { Diagnostico, FormatoExportacao, VersaoAvaliavel } from "@/types/diagnostics";

/** GET /diagnosticos/versoes: versões de datasets ativos para o gestor escolher (UC-07, passo 1). */
export function listarVersoesAvaliaveis(): Promise<VersaoAvaliavel[]> {
    return apiGet<VersaoAvaliavel[]>("/diagnosticos/versoes");
}

/** GET /diagnosticos/versoes/:versaoId: três indicadores da avaliação vigente da versão (RF005). */
export function obterDiagnostico(versaoId: string): Promise<Diagnostico> {
    return apiGet<Diagnostico>(`/diagnosticos/versoes/${versaoId}`);
}

/** Exporta os mesmos dados da tela em PDF ou XLSX (ADR-007). */
export function exportarDiagnostico(versaoId: string, formato: FormatoExportacao) {
    return apiDownload(`/diagnosticos/versoes/${versaoId}/exportar?formato=${formato}`, `diagnostico.${formato.toLowerCase()}`);
}
