import { useEffect } from "react";
import { useNavigate } from "react-router";
import { LoadingState } from "@/components/layout/states";
import { telaInicial } from "@/components/navigation/navegacao";
import { useUserStore } from "@/stores/user_store";

/** Entrada: leva à primeira tela do perfil ou à autenticação (T00). */
export function InicioPagina() {
    const navegar = useNavigate();
    const revalidate = useUserStore((estado) => estado.revalidate);
    useEffect(() => {
        void revalidate().then((valida) => navegar(valida ? telaInicial(useUserStore.getState().permissoes) : "/login", { replace: true }));
    }, [revalidate, navegar]);
    return <LoadingState rotulo="Carregando..." />;
}
