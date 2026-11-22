"use client";

import { useState } from "react";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { SituacaoBadge } from "@/components/datasets/situacao_badge";
import { Card } from "@/components/layout/card";
import { ListContent } from "@/components/layout/list_content";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { LoadingState } from "@/components/layout/states";
import { useDatasetsAuditados, useExtratos } from "@/hooks/audit/use_auditoria";
import { formatDateTime } from "@/lib/moment";
import type { SituacaoDataset } from "@/types/datasets";

function Extratos({ datasetId }: { datasetId: string }) {
    const extratos = useExtratos(datasetId);
    if (extratos.isPending) {
        return <LoadingState />;
    }
    return (
        <ListContent consulta={extratos} vazio={{ titulo: "Não há intervenções registradas para este dataset." }}>
            {(itens) => (
                <Table aria-label="Extratos do dataset" size="sm">
                    <Table.Header>
                        <Table.Head id="instante" label="Instante" isRowHeader />
                        <Table.Head id="versoes" label="Versões" />
                        <Table.Head id="alteradas" label="Alteradas" />
                        <Table.Head id="removidas" label="Removidas" />
                        <Table.Head id="usuario" label="Usuário (ID técnico)" />
                        <Table.Head id="acoes" label="" />
                    </Table.Header>
                    <Table.Body items={itens}>
                        {(extrato) => (
                            <Table.Row id={extrato.id}>
                                <Table.Cell>{formatDateTime(extrato.instanteUtc)}</Table.Cell>
                                <Table.Cell>
                                    v{extrato.versaoEntrada.numero} → v{extrato.versaoSaida.numero}
                                </Table.Cell>
                                <Table.Cell>{extrato.totalLinhasAlteradas}</Table.Cell>
                                <Table.Cell>{extrato.totalLinhasRemovidas}</Table.Cell>
                                <Table.Cell>
                                    <span className="font-mono text-xs">{extrato.usuarioId}</span>
                                </Table.Cell>
                                <Table.Cell>
                                    <Button size="sm" color="link-color" href={`/auditoria/${extrato.id}`}>
                                        Abrir extrato
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            )}
        </ListContent>
    );
}

function Auditoria() {
    const datasets = useDatasetsAuditados();
    const [selecionado, setSelecionado] = useState<string | null>(null);
    return (
        <>
            <PageHeader
                titulo="Relatório e auditoria"
                descricao="Extratos dos tratamentos confirmados. Os registros são somente de inserção e não podem ser editados."
            />
            <Card titulo="Datasets com intervenções" descricao="Inclui datasets excluídos logicamente: a exclusão preserva a auditoria.">
                <ListContent
                    consulta={datasets}
                    vazio={{ titulo: "Nenhuma intervenção registrada", descricao: "Os extratos aparecem após a confirmação de um tratamento." }}
                >
                    {(itens) => (
                        <ul className="grid gap-3 md:grid-cols-2">
                            {itens.map((dataset) => (
                                <li key={dataset.id}>
                                    <button
                                        type="button"
                                        aria-pressed={selecionado === dataset.id}
                                        onClick={() => setSelecionado(dataset.id)}
                                        className={`flex w-full flex-col gap-1 rounded-xl p-4 text-left ring-1 transition ${selecionado === dataset.id ? "ring-2 ring-brand" : "ring-secondary hover:bg-primary_hover"}`}
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="font-semibold text-primary">{dataset.nome}</span>
                                            <SituacaoBadge situacao={dataset.situacao as SituacaoDataset} />
                                        </span>
                                        <span className="text-sm text-tertiary">
                                            {dataset.totalExtratos} extrato(s) · último em {formatDateTime(dataset.ultimaIntervencao)}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ListContent>
            </Card>
            {selecionado && (
                <Card titulo="Extratos">
                    <Extratos datasetId={selecionado} />
                </Card>
            )}
        </>
    );
}

/** T07 — Consulta de extratos de auditoria (RF006, UC-06). */
export function AuditoriaTela() {
    return (
        <PermissionGate operacao="AUDITORIA_CONSULTAR">
            <Auditoria />
        </PermissionGate>
    );
}
