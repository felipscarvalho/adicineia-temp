import { apiDownload, apiGet } from "@/lib/api";
import type { DatasetAuditado, Extrato, ExtratoDetalhe } from "@/types/audit";

/** GET /auditoria/datasets: datasets com intervenções, inclusive os excluídos logicamente. */
export function listarDatasetsAuditados(): Promise<DatasetAuditado[]> {
    return apiGet<DatasetAuditado[]>("/auditoria/datasets");
}

export function listarExtratos(datasetId: string): Promise<Extrato[]> {
    return apiGet<Extrato[]>("/auditoria/extratos", { params: { datasetId } });
}

/** GET /auditoria/extratos/:id: campos da RN03 e alterações por linha paginadas. */
export function obterExtrato(id: string, pagina: number, tamanho: number): Promise<ExtratoDetalhe> {
    return apiGet<ExtratoDetalhe>(`/auditoria/extratos/${id}`, { params: { pagina, tamanho } });
}

/** GET /auditoria/extratos/:id/pdf: PDF gerado do mesmo DTO da consulta (ADR-007). */
export function exportarExtratoPdf(id: string) {
    return apiDownload(`/auditoria/extratos/${id}/pdf`, `extrato-auditoria-${id}.pdf`);
}
