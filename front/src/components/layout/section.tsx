import type { ReactNode } from "react";
import { Badge } from "@/components/base/badges/badges";

/** Seção com divisória superior dentro de um card. */
export function Section({ titulo, descricao, children }: { titulo: string; descricao?: ReactNode; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-4 border-t border-secondary pt-5 first:border-t-0 first:pt-0">
            <div className="flex flex-col gap-0.5">
                <h3 className="text-md font-semibold text-primary">{titulo}</h3>
                {descricao && <p className="text-sm text-tertiary">{descricao}</p>}
            </div>
            {children}
        </div>
    );
}

/** Campo só de leitura (rótulo + valor). */
export function DetailField({ rotulo, children, mono = false }: { rotulo: string; children: ReactNode; mono?: boolean }) {
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs font-medium text-quaternary uppercase">{rotulo}</dt>
            <dd className={mono ? "font-mono text-sm break-all text-secondary" : "text-sm text-secondary"}>{children ?? "—"}</dd>
        </div>
    );
}

/** Lista de valores em etiquetas. */
export function DetailTags({ rotulo, valores }: { rotulo: string; valores: string[] }) {
    return (
        <DetailField rotulo={rotulo}>
            {valores.length === 0 ? (
                "—"
            ) : (
                <span className="flex flex-wrap gap-1.5">
                    {valores.map((valor) => (
                        <Badge key={valor} type="modern" size="sm">
                            {valor}
                        </Badge>
                    ))}
                </span>
            )}
        </DetailField>
    );
}
