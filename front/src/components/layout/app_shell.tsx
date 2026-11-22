"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Menu02 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Logo } from "@/components/brand/logo";
import { NAVEGACAO, filtrarNavegacao } from "@/components/navigation/navegacao";
import { Sidebar } from "@/components/navigation/sidebar";
import { useUserStore } from "@/stores/user_store";
import { ClientOnly } from "./client_only";
import { LoadingState } from "./states";

function Area({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { usuario, permissoes, situacao, revalidate, logout } = useUserStore();
    const [menuAberto, setMenuAberto] = useState(false);

    // Revalida a sessão do cookie ao entrar na área logada; sem sessão, volta para /login.
    useEffect(() => {
        let ativo = true;
        void revalidate().then((valida) => {
            if (ativo && !valida) {
                router.replace("/login");
            }
        });
        return () => {
            ativo = false;
        };
    }, [revalidate, router]);

    if (situacao !== "autenticado" || !usuario) {
        return <LoadingState rotulo="Verificando a sessão..." />;
    }

    const secoes = filtrarNavegacao(NAVEGACAO, permissoes);
    const sair = () => void logout();

    return (
        <div className="flex min-h-dvh gap-4 p-2 lg:p-3">
            <div className="hidden lg:sticky lg:top-3 lg:block lg:h-[calc(100dvh-1.5rem)]">
                <Sidebar secoes={secoes} usuario={usuario} aoSair={sair} />
            </div>
            {menuAberto && (
                <div className="fixed inset-0 z-40 bg-overlay/60 p-2 lg:hidden" onClick={() => setMenuAberto(false)}>
                    <div className="h-full max-w-xs" onClick={(evento) => evento.stopPropagation()}>
                        <Sidebar secoes={secoes} usuario={usuario} aoSair={sair} className="glass-strong" />
                    </div>
                </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-4">
                <header className="flex items-center justify-between rounded-2xl glass px-4 py-3 ring-1 ring-secondary lg:hidden">
                    <Logo />
                    <ButtonUtility size="sm" color="tertiary" icon={Menu02} tooltip="Abrir menu" onClick={() => setMenuAberto(true)} />
                </header>
                <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-2 py-4 md:px-4 lg:py-6">{children}</main>
            </div>
        </div>
    );
}

/** Estrutura da área logada: só monta no navegador, revalida o usuário e filtra a navegação por permissão. */
export function AppShell({ children }: { children: ReactNode }) {
    return (
        <ClientOnly fallback={<LoadingState rotulo="Carregando..." />}>
            <Area>{children}</Area>
        </ClientOnly>
    );
}
