import type { ReactNode } from "react";
import { AlertCircle } from "@untitledui/icons";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";

/** Estado de carregamento de qualquer tela ou bloco. */
export function LoadingState({ rotulo = "Carregando..." }: { rotulo?: string }) {
    return (
        <div className="flex min-h-40 items-center justify-center py-10">
            <LoadingIndicator type="line-spinner" size="md" label={rotulo} />
        </div>
    );
}

/** Estado de erro com a mensagem do backend e opção de tentar de novo. */
export function ErrorState({
    titulo = "Não foi possível carregar",
    mensagem,
    aoTentarNovamente,
    children,
}: {
    titulo?: string;
    mensagem?: string;
    aoTentarNovamente?: () => void;
    children?: ReactNode;
}) {
    return (
        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
            <FeaturedIcon icon={AlertCircle} color="error" theme="light" size="md" />
            <p className="text-md font-semibold text-primary">{titulo}</p>
            {mensagem && <p className="max-w-lg text-sm text-tertiary">{mensagem}</p>}
            {children}
            {aoTentarNovamente && (
                <Button size="sm" color="secondary" onClick={aoTentarNovamente}>
                    Tentar novamente
                </Button>
            )}
        </div>
    );
}

/** Estado vazio simples. */
export function EmptyState({ titulo, descricao, acao }: { titulo: string; descricao?: ReactNode; acao?: ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-md font-semibold text-primary">{titulo}</p>
            {descricao && <p className="max-w-lg text-sm text-tertiary">{descricao}</p>}
            {acao}
        </div>
    );
}
