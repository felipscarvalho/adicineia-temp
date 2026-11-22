"use client";

import { useState } from "react";
import { PlayCircle } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { Alert } from "@/components/feedback/alert";
import { Card } from "@/components/layout/card";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { EmptyState } from "@/components/layout/states";
import { StatusSimulacaoBadge } from "@/components/simulations/status_simulacao";
import { useDataset, useDatasets } from "@/hooks/datasets/use_datasets";
import { useConjuntos } from "@/hooks/rules/use_conjuntos";
import { useSimulacoes, useSimular } from "@/hooks/simulations/use_simulacoes";
import { usePermissions } from "@/hooks/use_permissions";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";

function SimulacoesDaVersao({ versaoId }: { versaoId: string }) {
    const simulacoes = useSimulacoes(versaoId);
    if (!simulacoes.data || simulacoes.data.length === 0) {
        return <EmptyState titulo="Nenhuma simulação desta versão" descricao="Escolha um conjunto associado e solicite a simulação." />;
    }
    return (
        <Table aria-label="Simulações da versão" size="sm">
            <Table.Header>
                <Table.Head id="aceita" label="Aceita em" isRowHeader />
                <Table.Head id="conjunto" label="Conjunto" />
                <Table.Head id="status" label="Situação" />
                <Table.Head id="violacoes" label="Linhas com violação" />
                <Table.Head id="acoes" label="" />
            </Table.Header>
            <Table.Body items={simulacoes.data}>
                {(simulacao) => (
                    <Table.Row id={simulacao.id}>
                        <Table.Cell>{formatDateTime(simulacao.aceitaEm)}</Table.Cell>
                        <Table.Cell>
                            {simulacao.conjunto.nome} (r{simulacao.conjunto.revisao})
                        </Table.Cell>
                        <Table.Cell>
                            <StatusSimulacaoBadge status={simulacao.status} />
                        </Table.Cell>
                        <Table.Cell>{simulacao.totalLinhasComViolacao ?? "—"}</Table.Cell>
                        <Table.Cell>
                            <Button size="sm" color="link-color" href={`/simulacoes/${simulacao.id}`}>
                                Abrir
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
}

function Simulacoes() {
    const router = useRouter();
    const { can } = usePermissions();
    const datasets = useDatasets();
    const conjuntos = useConjuntos();
    const simular = useSimular();
    const [datasetId, setDatasetId] = useState<string | null>(null);
    const [versaoId, setVersaoId] = useState<string | null>(null);
    const [conjuntoId, setConjuntoId] = useState<string | null>(null);
    const [erro, setErro] = useState<ApiError | null>(null);
    const dataset = useDataset(datasetId ?? "", Boolean(datasetId));
    const versoes = datasetId ? (dataset.data?.versoes ?? []) : [];
    const associados = (conjuntos.data ?? []).filter((c) => datasetId && c.datasets.includes(datasetId));

    const solicitar = () => {
        if (!versaoId || !conjuntoId) return;
        setErro(null);
        simular.mutate(
            { versaoId, conjuntoId },
            { onSuccess: (simulacao) => router.push(`/simulacoes/${simulacao.id}`), onError: (falha) => setErro(falha as ApiError) },
        );
    };

    return (
        <>
            <PageHeader
                titulo="Simulações"
                descricao="Avalie uma versão com um conjunto de regras sem alterar nenhum dado. A execução é cancelada aos 60 segundos."
            />
            <Card titulo="Nova simulação" descricao="Selecione a versão do dataset e um conjunto associado a ele.">
                {erro && (
                    <Alert variante="erro" titulo={erro.message}>
                        {erro.errosDeCampo.map((e) => (
                            <p key={e.campo + e.mensagem}>{e.mensagem}</p>
                        ))}
                    </Alert>
                )}
                <div className="grid gap-4 md:grid-cols-3">
                    <Select
                        label="Dataset"
                        placeholder="Selecione"
                        items={(datasets.data ?? []).map((d) => ({ id: d.id, label: d.nome }))}
                        selectedKey={datasetId}
                        onSelectionChange={(chave) => {
                            setDatasetId(chave ? String(chave) : null);
                            setVersaoId(null);
                            setConjuntoId(null);
                        }}
                    >
                        {(item) => <Select.Item id={item.id} label={item.label} />}
                    </Select>
                    <Select
                        label="Versão"
                        placeholder={datasetId ? "Selecione" : "Escolha o dataset"}
                        isDisabled={!datasetId}
                        items={[...versoes]
                            .reverse()
                            .map((v) => ({ id: v.id, label: `v${v.numero}`, supportingText: `${v.totalRegistros.toLocaleString("pt-BR")} registros` }))}
                        selectedKey={versaoId}
                        onSelectionChange={(chave) => setVersaoId(chave ? String(chave) : null)}
                    >
                        {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                    <Select
                        label="Conjunto de regras"
                        placeholder={associados.length ? "Selecione" : "Nenhum conjunto associado"}
                        isDisabled={!datasetId || associados.length === 0}
                        items={associados.map((c) => ({ id: c.id, label: c.nome, supportingText: `r${c.revisao} · ${c.regras.length} regras` }))}
                        selectedKey={conjuntoId}
                        onSelectionChange={(chave) => setConjuntoId(chave ? String(chave) : null)}
                    >
                        {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                </div>
                {can("SIMULACAO_EXECUTAR") && (
                    <div>
                        <Button
                            color="primary"
                            className="glass-brand"
                            iconLeading={PlayCircle}
                            isDisabled={!versaoId || !conjuntoId}
                            isLoading={simular.isPending}
                            onClick={solicitar}
                        >
                            Simular
                        </Button>
                    </div>
                )}
            </Card>
            {versaoId && (
                <Card titulo="Simulações desta versão">
                    <SimulacoesDaVersao versaoId={versaoId} />
                </Card>
            )}
        </>
    );
}

/** T04 — Avaliação de qualidade por simulação (RF003, UC-03). */
export function SimulacoesTela() {
    return (
        <PermissionGate operacao="SIMULACAO_CONSULTAR">
            <Simulacoes />
        </PermissionGate>
    );
}
