import { ArrowLeft, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

/** Rodapé de paginação das tabelas. */
export function ListPagination({
    pagina,
    totalPaginas,
    total,
    aoMudar,
}: {
    pagina: number;
    totalPaginas: number;
    total: number;
    aoMudar: (pagina: number) => void;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-t border-secondary pt-4">
            <p className="text-sm text-tertiary">
                Página {pagina} de {totalPaginas} · {total.toLocaleString("pt-BR")} itens
            </p>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    color="secondary"

                    iconLeading={ArrowLeft}
                    isDisabled={pagina <= 1}
                    onClick={() => aoMudar(pagina - 1)}
                >
                    Anterior
                </Button>
                <Button
                    size="sm"
                    color="secondary"

                    iconTrailing={ArrowRight}
                    isDisabled={pagina >= totalPaginas}
                    onClick={() => aoMudar(pagina + 1)}
                >
                    Próxima
                </Button>
            </div>
        </div>
    );
}
