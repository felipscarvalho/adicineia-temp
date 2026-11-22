import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as datasetsService from "@/services/datasets";

export const datasetKeys = {
    all: ["datasets"] as const,
    lista: () => [...datasetKeys.all, "lista"] as const,
    detail: (id: string) => [...datasetKeys.all, "detalhe", id] as const,
    registros: (id: string, versaoId: string, pagina: number, tamanho: number) => [...datasetKeys.all, "registros", id, versaoId, pagina, tamanho] as const,
};

export function useDatasets(habilitado = true) {
    return useQuery({ queryKey: datasetKeys.lista(), queryFn: datasetsService.listarDatasets, enabled: habilitado });
}

export function useImportarDataset() {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: datasetsService.importarDataset,
        meta: { erroTratadoNaTela: true },
        onSuccess: () => cliente.invalidateQueries({ queryKey: datasetKeys.all }),
    });
}

export function useDataset(id: string) {
    return useQuery({ queryKey: datasetKeys.detail(id), queryFn: () => datasetsService.obterDataset(id) });
}

export function useAtualizarMetadados(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: (dados: { nome: string; descricao: string }) => datasetsService.atualizarMetadados(id, dados),
        onSuccess: () => cliente.invalidateQueries({ queryKey: datasetKeys.all }),
    });
}

export function useImportarNovaVersao(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: (dados: Parameters<typeof datasetsService.importarNovaVersao>[1]) => datasetsService.importarNovaVersao(id, dados),
        meta: { erroTratadoNaTela: true },
        onSuccess: () => cliente.invalidateQueries({ queryKey: datasetKeys.all }),
    });
}

export function useExcluirDataset(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: () => datasetsService.excluirDataset(id),
        onSuccess: () => cliente.invalidateQueries({ queryKey: datasetKeys.all }),
    });
}

export function useRegistros(id: string, versaoId: string | null, pagina: number, tamanho = 20) {
    return useQuery({
        queryKey: datasetKeys.registros(id, versaoId ?? "", pagina, tamanho),
        queryFn: () => datasetsService.listarRegistros(id, versaoId!, pagina, tamanho),
        enabled: Boolean(versaoId),
        placeholderData: keepPreviousData,
    });
}
