"use client";

import { type ReactNode, useState } from "react";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "@/components/feedback/toast";
import type { ApiError } from "@/lib/api";

declare module "@tanstack/react-query" {
    interface Register {
        mutationMeta: { erroTratadoNaTela?: boolean };
    }
}

/**
 * Falha de escrita sem tratamento próprio na tela vira toast com a mensagem do backend (inclusive a
 * recusa 403 de perfil vedado). Mutations com formulário marcam `meta.erroTratadoNaTela`.
 */
export function criarQueryClient(): QueryClient {
    return new QueryClient({
        mutationCache: new MutationCache({
            onError: (erro, _variaveis, _contexto, mutation) => {
                if (!mutation.meta?.erroTratadoNaTela) {
                    toast.error((erro as ApiError).message ?? "Não foi possível concluir a operação.");
                }
            },
        }),
    });
}

/** QueryClient do TanStack Query, criado uma vez no layout raiz; cache só em memória, opções padrão. */
export function QueryProvider({ children }: { children: ReactNode }) {
    const [cliente] = useState(criarQueryClient);
    return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
