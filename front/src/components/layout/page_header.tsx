import type { ReactNode } from "react";

/** Cabeçalho de página: título, descrição e ações à direita. */
export function PageHeader({ titulo, descricao, acoes }: { titulo: string; descricao?: ReactNode; acoes?: ReactNode }) {
    return (
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-1">
                <h1 className="font-display text-display-xs font-semibold text-primary">{titulo}</h1>
                {descricao && <p className="text-md text-tertiary">{descricao}</p>}
            </div>
            {acoes && <div className="flex flex-wrap items-center gap-3">{acoes}</div>}
        </header>
    );
}
