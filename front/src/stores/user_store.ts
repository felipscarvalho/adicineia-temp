import { create } from "zustand";
import { configurarSessao } from "@/lib/api";
import * as authService from "@/services/auth";
import type { Operacao, Sessao, Usuario } from "@/types/auth";

type Situacao = "verificando" | "autenticado" | "anonimo";

interface UserState {
    usuario: Usuario | null;
    permissoes: Operacao[];
    csrfToken: string | null;
    situacao: Situacao;
    login(email: string, senha: string): Promise<Sessao>;
    logout(): Promise<void>;
    revalidate(): Promise<boolean>;
    clear(): void;
    can(operacao: Operacao): boolean;
    canAnywhere(operacoes: Operacao[]): boolean;
}

/**
 * Usuário autenticado (única exceção de dado do servidor fora do TanStack Query).
 * Adaptação à ADR-006: a sessão é o cookie HttpOnly, inacessível ao JavaScript; o store guarda
 * usuário, permissões e o token CSRF em memória e os recupera com `revalidate()` a cada carga,
 * por isso não há persistência em localStorage.
 */
export const useUserStore = create<UserState>((set, get) => ({
    usuario: null,
    permissoes: [],
    csrfToken: null,
    situacao: "verificando",

    async login(email, senha) {
        const sessao = await authService.entrar(email, senha);
        set({ usuario: sessao.usuario, permissoes: sessao.permissoes, csrfToken: sessao.csrfToken, situacao: "autenticado" });
        return sessao;
    },

    async logout() {
        try {
            await authService.sair();
        } finally {
            get().clear();
            // Recarga completa: descarta o cache do TanStack Query do usuário anterior.
            window.location.href = "/login";
        }
    },

    async revalidate() {
        try {
            const sessao = await authService.obterSessao();
            set({ usuario: sessao.usuario, permissoes: sessao.permissoes, csrfToken: sessao.csrfToken, situacao: "autenticado" });
            return true;
        } catch {
            get().clear();
            return false;
        }
    },

    clear() {
        set({ usuario: null, permissoes: [], csrfToken: null, situacao: "anonimo" });
    },

    can(operacao) {
        return get().permissoes.includes(operacao);
    },

    /** Sem escopos por instituição (P1, seção 8.3): verdadeiro se o perfil tiver alguma das operações. */
    canAnywhere(operacoes) {
        const permissoes = get().permissoes;
        return operacoes.some((operacao) => permissoes.includes(operacao));
    },
}));

configurarSessao({
    obterCsrf: () => useUserStore.getState().csrfToken,
    aoPerderSessao: () => {
        useUserStore.getState().clear();
        if (window.location.pathname !== "/login") {
            // Sessão perdida (401): recarga completa para descartar o cache.
            window.location.href = "/login";
        }
    },
});
