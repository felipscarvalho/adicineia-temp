"use client";

import { useState } from "react";
import { Plus } from "@untitledui/icons";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/layout/card";
import { ListContent } from "@/components/layout/list_content";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DimensaoBadge } from "@/components/rules/dimensao_badge";
import { useConjuntos } from "@/hooks/rules/use_conjuntos";
import { usePermissions } from "@/hooks/use_permissions";
import { formatDateTime } from "@/lib/moment";
import { NovoConjuntoModal } from "./novo_conjunto_modal";

function Conjuntos() {
    const { can } = usePermissions();
    const consulta = useConjuntos();
    const [criando, setCriando] = useState(false);
    return (
        <>
            <PageHeader
                titulo="Conjuntos de regras"
                descricao="Regras organizadas na ordem de execução e associadas aos datasets avaliados."
                acoes={
                    can("CONJUNTO_MANTER") && (
                        <Button color="primary" className="glass-brand" iconLeading={Plus} onClick={() => setCriando(true)}>
                            Novo conjunto
                        </Button>
                    )
                }
            />
            <Card>
                <ListContent
                    consulta={consulta}
                    vazio={{ titulo: "Nenhum conjunto ativo", descricao: "Agrupe regras em um conjunto para simular e tratar um dataset." }}
                >
                    {(itens) => (
                        <Table aria-label="Conjuntos ativos" size="sm">
                            <Table.Header>
                                <Table.Head id="nome" label="Conjunto" isRowHeader />
                                <Table.Head id="regras" label="Regras" />
                                <Table.Head id="datasets" label="Datasets" />
                                <Table.Head id="revisao" label="Revisão" />
                                <Table.Head id="atualizado" label="Atualizado em" />
                            </Table.Header>
                            <Table.Body items={itens}>
                                {(conjunto) => (
                                    <Table.Row id={conjunto.id}>
                                        <Table.Cell>
                                            <Button color="link-color" size="sm" href={`/conjuntos/${conjunto.id}`}>
                                                {conjunto.nome}
                                            </Button>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="flex flex-wrap gap-1">
                                                {conjunto.regras.length === 0
                                                    ? "—"
                                                    : conjunto.regras.map((r) => <DimensaoBadge key={r.regraId} dimensao={r.dimensao} />)}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>{conjunto.datasets.length}</Table.Cell>
                                        <Table.Cell>r{conjunto.revisao}</Table.Cell>
                                        <Table.Cell>{formatDateTime(conjunto.atualizadoEm)}</Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    )}
                </ListContent>
            </Card>
            <NovoConjuntoModal isOpen={criando} aoFechar={() => setCriando(false)} />
        </>
    );
}

/** T02 — Gestão de conjuntos de regras (RF002, UC-02). */
export function ConjuntosTela() {
    return (
        <PermissionGate operacao="CONJUNTO_CONSULTAR">
            <Conjuntos />
        </PermissionGate>
    );
}
