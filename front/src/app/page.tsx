"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientOnly } from "@/components/layout/client_only";
import { LoadingState } from "@/components/layout/states";
import { telaInicial } from "@/components/navigation/navegacao";
import { useUserStore } from "@/stores/user_store";

function Redirecionar() {
    const router = useRouter();
    const revalidate = useUserStore((estado) => estado.revalidate);
    useEffect(() => {
        void revalidate().then((valida) => router.replace(valida ? telaInicial(useUserStore.getState().permissoes) : "/login"));
    }, [revalidate, router]);
    return <LoadingState rotulo="Carregando..." />;
}

/** Entrada: leva à primeira tela do perfil ou à autenticação (T00). */
export default function Inicio() {
    return (
        <ClientOnly fallback={<LoadingState />}>
            <Redirecionar />
        </ClientOnly>
    );
}
