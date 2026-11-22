import { apiGet, apiPost } from "@/lib/api";
import type { Sessao } from "@/types/auth";

/** POST /auth/entrar (UC-08). */
export function entrar(email: string, senha: string): Promise<Sessao> {
    return apiPost<Sessao>("/auth/entrar", { email, senha });
}

/** GET /auth/sessao: revalida a sessão do cookie e devolve o token CSRF. */
export function obterSessao(): Promise<Sessao> {
    return apiGet<Sessao>("/auth/sessao");
}

/** POST /auth/sair: encerra a sessão no servidor. */
export function sair(): Promise<void> {
    return apiPost<void>("/auth/sair");
}
