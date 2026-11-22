import { useMutation, useQuery } from "@tanstack/react-query";
import { salvarArquivo } from "@/lib/download";
import * as diagnosticosService from "@/services/diagnostics";
import type { FormatoExportacao } from "@/types/diagnostics";

export const diagnosticoKeys = {
    all: ["diagnosticos"] as const,
    versoes: () => [...diagnosticoKeys.all, "versoes"] as const,
    detail: (versaoId: string) => [...diagnosticoKeys.all, "detalhe", versaoId] as const,
};

export function useVersoesAvaliaveis() {
    return useQuery({ queryKey: diagnosticoKeys.versoes(), queryFn: diagnosticosService.listarVersoesAvaliaveis });
}

export function useDiagnostico(versaoId: string | null) {
    return useQuery({
        queryKey: diagnosticoKeys.detail(versaoId ?? ""),
        queryFn: () => diagnosticosService.obterDiagnostico(versaoId!),
        enabled: Boolean(versaoId),
    });
}

/** Falha na exportação não perde os resultados: o usuário pode tentar de novo (UC-07, fluxo 5a). */
export function useExportarDiagnostico() {
    return useMutation({
        mutationFn: ({ versaoId, formato }: { versaoId: string; formato: FormatoExportacao }) => diagnosticosService.exportarDiagnostico(versaoId, formato),
        onSuccess: ({ conteudo, nomeArquivo }) => salvarArquivo(conteudo, nomeArquivo),
    });
}
