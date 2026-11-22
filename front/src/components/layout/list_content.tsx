import type { ReactNode } from "react";
import type { ApiError } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "./states";

/** Conteúdo de listas: carregando, erro, vazio ou os itens. */
export function ListContent<T>({
    consulta,
    vazio,
    children,
}: {
    consulta: { isPending: boolean; isError: boolean; error: unknown; data: T[] | undefined; refetch: () => unknown };
    vazio: { titulo: string; descricao?: ReactNode; acao?: ReactNode };
    children: (itens: T[]) => ReactNode;
}) {
    if (consulta.isPending) {
        return <LoadingState />;
    }
    if (consulta.isError) {
        return <ErrorState mensagem={(consulta.error as ApiError | undefined)?.message} aoTentarNovamente={() => consulta.refetch()} />;
    }
    if (!consulta.data || consulta.data.length === 0) {
        return <EmptyState {...vazio} />;
    }
    return <>{children(consulta.data)}</>;
}
