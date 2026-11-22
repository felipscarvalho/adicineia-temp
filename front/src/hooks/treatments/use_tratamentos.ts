import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditoriaKeys } from "@/hooks/audit/use_auditoria";
import { datasetKeys } from "@/hooks/datasets/use_datasets";
import { simulacaoKeys } from "@/hooks/simulations/use_simulacoes";
import * as tratamentosService from "@/services/treatments";

/** O tratamento cria versão e extrato e consolida a simulação: invalida as três famílias de dados. */
export function useAplicarTratamento() {
    const cliente = useQueryClient();
    return useMutation({
        mutationFn: tratamentosService.aplicarTratamento,
        meta: { erroTratadoNaTela: true },
        onSuccess: () =>
            Promise.all([
                cliente.invalidateQueries({ queryKey: simulacaoKeys.all }),
                cliente.invalidateQueries({ queryKey: datasetKeys.all }),
                cliente.invalidateQueries({ queryKey: auditoriaKeys.all }),
            ]),
    });
}
