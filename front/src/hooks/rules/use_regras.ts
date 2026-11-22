import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { simulacaoKeys } from "@/hooks/simulations/use_simulacoes";
import * as regrasService from "@/services/rules/regras";
import { conjuntoKeys } from "./use_conjuntos";

export const regraKeys = {
    all: ["regras"] as const,
    lista: () => [...regraKeys.all, "lista"] as const,
    detail: (id: string) => [...regraKeys.all, "detalhe", id] as const,
    revisoes: (id: string) => [...regraKeys.all, "revisoes", id] as const,
    catalogo: () => ["catalogo"] as const,
};

export function useCatalogo() {
    return useQuery({ queryKey: regraKeys.catalogo(), queryFn: regrasService.obterCatalogo });
}

export function useRegras(habilitado = true) {
    return useQuery({ queryKey: regraKeys.lista(), queryFn: regrasService.listarRegras, enabled: habilitado });
}

export function useRegra(id: string) {
    return useQuery({ queryKey: regraKeys.detail(id), queryFn: () => regrasService.obterRegra(id) });
}

export function useRevisoesRegra(id: string) {
    return useQuery({ queryKey: regraKeys.revisoes(id), queryFn: () => regrasService.listarRevisoesRegra(id) });
}

export function useCriarRegra() {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: regrasService.criarRegra,
        meta: { erroTratadoNaTela: true },
        onSuccess: () => cliente.invalidateQueries({ queryKey: regraKeys.all }),
    });
}

/** Editar regra revisa também os conjuntos e invalida simulações: invalida as duas famílias de keys. */
export function useAtualizarRegra(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: (payload: Partial<regrasService.RegraPayload>) => regrasService.atualizarRegra(id, payload),
        meta: { erroTratadoNaTela: true },
        onSuccess: () =>
            Promise.all([
                cliente.invalidateQueries({ queryKey: regraKeys.all }),
                cliente.invalidateQueries({ queryKey: conjuntoKeys.all }),
                cliente.invalidateQueries({ queryKey: simulacaoKeys.all }),
            ]),
    });
}

export function useExcluirRegra(id: string) {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: () => regrasService.excluirRegra(id),
        onSuccess: () => cliente.invalidateQueries({ queryKey: regraKeys.all }),
    });
}
