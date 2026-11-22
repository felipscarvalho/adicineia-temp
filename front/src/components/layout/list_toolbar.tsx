import type { ReactNode } from "react";
import { SearchLg } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";

/** Barra das listas: filtros à esquerda e busca à direita. */
export function ListToolbar({
    filtros,
    busca,
    aoBuscar,
    placeholder = "Buscar",
}: {
    filtros?: ReactNode;
    busca?: string;
    aoBuscar?: (valor: string) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-3">{filtros}</div>
            {aoBuscar && (
                <Input
                    aria-label={placeholder}
                    placeholder={placeholder}
                    icon={SearchLg}
                    value={busca}
                    onChange={aoBuscar}
                    className="md:w-72"
                    inputClassName="glass-field"
                    size="sm"
                />
            )}
        </div>
    );
}
