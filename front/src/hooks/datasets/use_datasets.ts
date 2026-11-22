import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as datasetsService from "@/services/datasets";

export const datasetKeys = {
    all: ["datasets"] as const,
    lista: () => [...datasetKeys.all, "lista"] as const,
    detail: (id: string) => [...datasetKeys.all, "detalhe", id] as const,
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
