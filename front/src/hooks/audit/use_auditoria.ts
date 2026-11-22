import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { salvarArquivo } from "@/lib/download";
import * as auditoriaService from "@/services/audit";

export const auditoriaKeys = {
    all: ["auditoria"] as const,
    datasets: () => [...auditoriaKeys.all, "datasets"] as const,
    extratos: (datasetId: string) => [...auditoriaKeys.all, "extratos", datasetId] as const,
    extrato: (id: string, pagina: number, tamanho: number) => [...auditoriaKeys.all, "extrato", id, pagina, tamanho] as const,
};

export function useDatasetsAuditados() {
    return useQuery({ queryKey: auditoriaKeys.datasets(), queryFn: auditoriaService.listarDatasetsAuditados });
}

export function useExtratos(datasetId: string | null) {
    return useQuery({
        queryKey: auditoriaKeys.extratos(datasetId ?? ""),
        queryFn: () => auditoriaService.listarExtratos(datasetId!),
        enabled: Boolean(datasetId),
    });
}

export function useExtrato(id: string, pagina: number, tamanho = 50) {
    return useQuery({
        queryKey: auditoriaKeys.extrato(id, pagina, tamanho),
        queryFn: () => auditoriaService.obterExtrato(id, pagina, tamanho),
        placeholderData: keepPreviousData,
    });
}

/** Exportação não altera registros: falha permite nova tentativa (UC-06, fluxo 5a). */
export function useExportarExtratoPdf() {
    return useMutation({
        mutationFn: auditoriaService.exportarExtratoPdf,
        onSuccess: ({ conteudo, nomeArquivo }) => salvarArquivo(conteudo, nomeArquivo),
    });
}
