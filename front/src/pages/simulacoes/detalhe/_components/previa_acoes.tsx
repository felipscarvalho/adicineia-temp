import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { EmptyState } from "@/components/layout/states";
import type { LinhaPrevia } from "@/types/simulations";

function Valores({ valores }: { valores: Record<string, string> | null }) {
    if (!valores) {
        return <span className="text-xs text-error-primary">Linha removida</span>;
    }
    return (
        <dl className="flex flex-col gap-0.5">
            {Object.entries(valores).map(([coluna, valor]) => (
                <div key={coluna} className="flex gap-2 text-xs">
                    <dt className="text-quaternary">{coluna}:</dt>
                    <dd className="font-mono whitespace-pre text-secondary">{valor === "" ? "(vazio)" : `“${valor}”`}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Prévia de até 20 linhas com valores antes e depois das ações do catálogo (RF003). */
export function PreviaAcoes({ previa }: { previa: LinhaPrevia[] }) {
    if (previa.length === 0) {
        return <EmptyState titulo="Nenhuma alteração prevista" descricao="As regras deste conjunto apenas avaliam ou não encontraram valores a tratar." />;
    }
    return (
        <Table aria-label="Prévia das alterações" size="sm">
            <Table.Header>
                <Table.Head id="linha" label="Linha" isRowHeader />
                <Table.Head id="tipo" label="Alteração" />
                <Table.Head id="antes" label="Antes" />
                <Table.Head id="depois" label="Depois" />
            </Table.Header>
            <Table.Body items={previa.map((p) => ({ ...p, id: p.linha }))}>
                {(linha) => (
                    <Table.Row id={linha.linha}>
                        <Table.Cell>{linha.linha}</Table.Cell>
                        <Table.Cell>
                            <Badge type="pill-color" color={linha.tipo === "REMOCAO" ? "error" : "brand"} size="sm">
                                {linha.tipo === "REMOCAO" ? "Remoção" : "Atualização"}
                            </Badge>
                        </Table.Cell>
                        <Table.Cell>
                            <Valores valores={linha.antes} />
                        </Table.Cell>
                        <Table.Cell>
                            <Valores valores={linha.depois} />
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
}
