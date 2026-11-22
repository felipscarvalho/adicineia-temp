import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/** Card de vidro padrão. */
export function Card({
    titulo,
    descricao,
    acoes,
    children,
    className,
}: {
    titulo?: string;
    descricao?: ReactNode;
    acoes?: ReactNode;
    children?: ReactNode;
    className?: string;
}) {
    return (
        <section className={cx("flex flex-col gap-5 rounded-2xl glass p-5 shadow-xs ring-1 ring-secondary md:p-6", className)}>
            {(titulo || acoes) && (
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                        {titulo && <h2 className="text-lg font-semibold text-primary">{titulo}</h2>}
                        {descricao && <p className="text-sm text-tertiary">{descricao}</p>}
                    </div>
                    {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

/** Card em duas colunas: aside (resumo) e conteúdo. */
export function SplitCard({ aside, children, className }: { aside: ReactNode; children: ReactNode; className?: string }) {
    return (
        <section className={cx("grid gap-6 rounded-2xl glass p-5 shadow-xs ring-1 ring-secondary md:p-6 lg:grid-cols-[18rem_1fr]", className)}>
            <aside className="flex flex-col gap-4 lg:border-r lg:border-secondary lg:pr-6">{aside}</aside>
            <div className="flex min-w-0 flex-col gap-6">{children}</div>
        </section>
    );
}
