import type { ReactElement, ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "react-aria-components";
import { MemoryRouter } from "react-router";
import { Toaster } from "@/components/feedback/toast";
import { criarQueryClient } from "@/components/query_provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { useUserStore } from "@/stores/user_store";
import type { Sessao } from "@/types/auth";
import { sessaoAnalista } from "./servidor";

/** Renderiza com os mesmos provedores da aplicação (cache novo e sem novas tentativas). */
export function renderizar(ui: ReactElement, opcoes: { sessao?: Sessao | null } = {}) {
    const sessao = opcoes.sessao === undefined ? sessaoAnalista : opcoes.sessao;
    if (sessao) {
        useUserStore.setState({ usuario: sessao.usuario, permissoes: sessao.permissoes, csrfToken: sessao.csrfToken, situacao: "autenticado" });
    } else {
        useUserStore.setState({ usuario: null, permissoes: [], csrfToken: null, situacao: "anonimo" });
    }
    const cliente = criarQueryClient();
    cliente.setDefaultOptions({ queries: { retry: false }, mutations: { retry: false } });
    const Envoltorio = ({ children }: { children: ReactNode }) => (
        <ThemeProvider>
            <MemoryRouter>
                <QueryClientProvider client={cliente}>
                    <I18nProvider locale="pt-BR">
                        {children}
                        <Toaster />
                    </I18nProvider>
                </QueryClientProvider>
            </MemoryRouter>
        </ThemeProvider>
    );
    return { usuario: userEvent.setup(), cliente, ...render(ui, { wrapper: Envoltorio }) };
}
