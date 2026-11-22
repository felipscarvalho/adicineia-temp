import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { abreviarHash } from "@/components/datasets/situacao_badge";
import { formatDateTime } from "@/lib/moment";
import type { Versao } from "@/types/datasets";

/** Histórico de versões: cada versão aponta a predecessora (ADR-005). */
export function TabelaVersoes({
    versoes,
    selecionada,
    aoSelecionar,
}: {
    versoes: Versao[];
    selecionada: string | null;
    aoSelecionar: (versaoId: string) => void;
}) {
    const numeroPorId = new Map(versoes.map((v) => [v.id, v.numero]));
    return (
        <Table aria-label="Versões do dataset" size="sm">
            <Table.Header>
                <Table.Head id="numero" label="Versão" isRowHeader />
                <Table.Head id="origem" label="Origem" />
                <Table.Head id="registros" label="Registros" />
                <Table.Head id="hash" label="SHA-256" />
                <Table.Head id="criada" label="Criada em" />
                <Table.Head id="acoes" label="" />
            </Table.Header>
            <Table.Body items={[...versoes].reverse()}>
                {(versao) => (
                    <Table.Row id={versao.id}>
                        <Table.Cell>
                            <span className="font-semibold text-primary">v{versao.numero}</span>
                            {versao.versaoPredecessoraId && (
                                <span className="block text-xs text-tertiary">derivada de v{numeroPorId.get(versao.versaoPredecessoraId)}</span>
                            )}
                        </Table.Cell>
                        <Table.Cell>
                            <Badge type="modern" size="sm">
                                {versao.origem === "TRATAMENTO" ? "Tratamento" : "Importação"}
                            </Badge>
                        </Table.Cell>
                        <Table.Cell>
                            {versao.totalRegistros.toLocaleString("pt-BR")} × {versao.totalColunas}
                        </Table.Cell>
                        <Table.Cell>
                            <span className="font-mono text-xs" title={versao.hashSha256}>
                                {abreviarHash(versao.hashSha256)}
                            </span>
                        </Table.Cell>
                        <Table.Cell>{formatDateTime(versao.criadoEm)}</Table.Cell>
                        <Table.Cell>
                            <Button
                                size="sm"
                                color={selecionada === versao.id ? "secondary" : "tertiary"}
                                onClick={() => aoSelecionar(versao.id)}
                                aria-label={`Ver registros da v${versao.numero}`}
                            >
                                {selecionada === versao.id ? "Exibindo" : "Ver registros"}
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
}
