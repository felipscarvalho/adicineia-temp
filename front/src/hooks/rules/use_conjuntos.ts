import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as conjuntosService from "@/services/rules/conjuntos";

export const conjuntoKeys = {
    all: ["conjuntos"] as const,
    lista: () => [...conjuntoKeys.all, "lista"] as const,
    detail: (id: string) => [...conjuntoKeys.all, "detalhe", id] as const,
    revisoes: (id: string) => [...conjuntoKeys.all, "revisoes", id] as const,
};

export function useConjuntos(habilitado = true) {
    return useQuery({ queryKey: conjuntoKeys.lista(), queryFn: conjuntosService.listarConjuntos, enabled: habilitado });
}

export function useConjunto(id: string) {
    return useQuery({ queryKey: conjuntoKeys.detail(id), queryFn: () => conjuntosService.obterConjunto(id) });
}

export function useRevisoesConjunto(id: string) {
    return useQuery({ queryKey: conjuntoKeys.revisoes(id), queryFn: () => conjuntosService.listarRevisoesConjunto(id) });
}

export function useCriarConjunto() {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: conjuntosService.criarConjunto,
        meta: { erroTratadoNaTela: true },
        onSuccess: () => cliente.invalidateQueries({ queryKey: conjuntoKeys.all }),
    });
}

export function useAtualizarConjunto(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<conjuntosService.ConjuntoPayload>) => conjuntosService.atualizarConjunto(id, payload),
        meta: { erroTratadoNaTela: true },
        onSuccess: () => Promise.all([cliente.invalidateQueries({ queryKey: conjuntoKeys.all }), cliente.invalidateQueries({ queryKey: ["simulacoes"] })]),
    });
}

export function useExcluirConjunto(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: () => conjuntosService.excluirConjunto(id),
        onSuccess: () => Promise.all([cliente.invalidateQueries({ queryKey: conjuntoKeys.all }), cliente.invalidateQueries({ queryKey: ["simulacoes"] })]),
    });
}

export function useAssociarDataset(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: (datasetId: string) => conjuntosService.associarDataset(id, datasetId),
        onSuccess: () => cliente.invalidateQueries({ queryKey: conjuntoKeys.all }),
    });
}

export function useDesassociarDataset(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: (datasetId: string) => conjuntosService.desassociarDataset(id, datasetId),
        onSuccess: () => cliente.invalidateQueries({ queryKey: conjuntoKeys.all }),
    });
}
