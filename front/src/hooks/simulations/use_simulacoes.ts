import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as simulacoesService from "@/services/simulations";

export const simulacaoKeys = {
    all: ["simulacoes"] as const,
    detail: (id: string) => [...simulacaoKeys.all, "detalhe", id] as const,
    porVersao: (versaoId: string) => [...simulacaoKeys.all, "versao", versaoId] as const,
};

/** Intervalo de consulta enquanto a simulação está em execução (a SPA consulta o estado, ADR-008). */
export const INTERVALO_CONSULTA_MS = 1000;

export function useSimulacao(id: string) {
    return useQuery({
        queryKey: simulacaoKeys.detail(id),
        queryFn: () => simulacoesService.obterSimulacao(id),
        refetchInterval: (consulta) => (consulta.state.data?.status === "EM_EXECUCAO" ? INTERVALO_CONSULTA_MS : false),
    });
}

export function useSimulacoes(versaoId: string | null) {
    return useQuery({
        queryKey: simulacaoKeys.porVersao(versaoId ?? ""),
        queryFn: () => simulacoesService.listarSimulacoes(versaoId!),
        enabled: Boolean(versaoId),
    });
}

export function useSimular() {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: simulacoesService.simular,
        meta: { erroTratadoNaTela: true },
        onSuccess: () => cliente.invalidateQueries({ queryKey: simulacaoKeys.all }),
    });
}
