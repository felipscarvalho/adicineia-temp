import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { formatDate } from "@/lib/moment";
import type { Dataset } from "@/types/datasets";

export function TabelaDatasets({ datasets }: { datasets: Dataset[] }) {
    return (
        <Table aria-label="Datasets ativos" size="sm">
            <Table.Header>
                <Table.Head id="nome" label="Nome" isRowHeader />
                <Table.Head id="versao" label="Versão atual" />
                <Table.Head id="registros" label="Registros" />
                <Table.Head id="colunas" label="Colunas" />
                <Table.Head id="atualizado" label="Atualizado em" />
            </Table.Header>
            <Table.Body items={datasets}>
                {(dataset) => (
                    <Table.Row id={dataset.id}>
                        <Table.Cell>
                            <div className="flex flex-col">
                                <Button color="link-color" size="sm" href={`/datasets/${dataset.id}`}>
                                    {dataset.nome}
                                </Button>
                                {dataset.descricao && <span className="line-clamp-1 text-xs text-tertiary">{dataset.descricao}</span>}
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <Badge type="modern" size="sm">
                                v{dataset.versaoAtual?.numero ?? "—"} de {dataset.totalVersoes}
                            </Badge>
                        </Table.Cell>
                        <Table.Cell>{dataset.versaoAtual?.totalRegistros.toLocaleString("pt-BR") ?? "—"}</Table.Cell>
                        <Table.Cell>{dataset.versaoAtual?.totalColunas ?? "—"}</Table.Cell>
                        <Table.Cell>{formatDate(dataset.atualizadoEm)}</Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
}
