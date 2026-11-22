import { useUserStore } from "@/stores/user_store";
import type { Operacao } from "@/types/auth";

/** Permissões do usuário para exibir ou ocultar ações; o backend continua sendo quem garante. */
export function usePermissions() {
    const permissoes = useUserStore((estado) => estado.permissoes);
    return {
        permissoes,
        can: (operacao: Operacao) => permissoes.includes(operacao),
        canAnywhere: (operacoes: Operacao[]) => operacoes.some((operacao) => permissoes.includes(operacao)),
    };
}
