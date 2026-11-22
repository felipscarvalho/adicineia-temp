"use client";

import { useState } from "react";
import { ArrowLeft, Download01 } from "@untitledui/icons";
import { useParams } from "next/navigation";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { abreviarHash } from "@/components/datasets/situacao_badge";
import { Card, SplitCard } from "@/components/layout/card";
import { ListPagination } from "@/components/layout/list_pagination";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DetailField, Section } from "@/components/layout/section";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { useExportarExtratoPdf, useExtrato } from "@/hooks/audit/use_auditoria";
import { usePermissions } from "@/hooks/use_permissions";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import { ROTULO_ACAO } from "@/types/rules/regra";

const TAMANHO = 50;

function Detalhe({ id }: { id: string }) {
    const { can } = usePermissions();
    const [pagina, setPagina] = useState(1);
    const consulta = useExtrato(id, pagina, TAMANHO);
    const exportar = useExportarExtratoPdf();

    if (consulta.isPending) {
        return <LoadingState />;
    }
    if (consulta.isError) {
        return <ErrorState titulo="Extrato indisponível" mensagem={(consulta.error as ApiError).message} />;
    }
    const extrato = consulta.data;
    const { alteracoes } = extrato;

    return (
        <>
            <PageHeader
                titulo="Extrato de auditoria"
                descricao={`${extrato.dataset.nome} · ${formatDateTime(extrato.instanteUtc)}`}
                acoes={
                    <>
                        <Button color="tertiary" iconLeading={ArrowLeft} href="/auditoria">
                            Auditoria
                        </Button>
                        {can("AUDITORIA_EXPORTAR") && (
                            <Button
                                color="primary"
                                className="glass-brand"
                                iconLeading={Download01}
                                isLoading={exportar.isPending}
                                onClick={() => exportar.mutate(extrato.id)}
                            >
                                Exportar PDF
                            </Button>
                        )}
                    </>
                }
            />
            <SplitCard
                aside={
                    <dl className="flex flex-col gap-4">
                        <DetailField rotulo="Operação">{extrato.operacao}</DetailField>
                        <DetailField rotulo="Instante (UTC)">{extrato.instanteUtc}</DetailField>
                        <DetailField rotulo="Usuário (ID técnico)" mono>
                            {extrato.usuarioId}
                        </DetailField>
                        <DetailField rotulo="Extrato" mono>
                            {extrato.id}
                        </DetailField>
                    </dl>
                }
            >
                <Section titulo="Versões">
                    <dl className="grid gap-4 md:grid-cols-2">
                        <DetailField rotulo={`Entrada · v${extrato.versaoEntrada.numero}`} mono>
                            <span title={extrato.versaoEntrada.hashSha256}>{abreviarHash(extrato.versaoEntrada.hashSha256)}</span>
                        </DetailField>
                        <DetailField rotulo={`Saída · v${extrato.versaoSaida.numero}`} mono>
                            <span title={extrato.versaoSaida.hashSha256}>{abreviarHash(extrato.versaoSaida.hashSha256)}</span>
                        </DetailField>
                    </dl>
                </Section>
                <Section titulo="Totais (cada linha contada uma vez)">
                    <dl className="grid gap-4 sm:grid-cols-3">
                        <DetailField rotulo="Linhas alteradas">{extrato.totalLinhasAlteradas}</DetailField>
                        <DetailField rotulo="Linhas removidas">{extrato.totalLinhasRemovidas}</DetailField>
                        <DetailField rotulo="Total de linhas afetadas">{extrato.totalLinhasAfetadas}</DetailField>
                    </dl>
                </Section>
                <Section titulo={`Regras do conjunto (revisão ${extrato.conjunto.revisao})`}>
                    <ul className="flex flex-col gap-1 text-sm text-secondary">
                        {extrato.revisoesRegras.map((regra) => (
                            <li key={regra.regraId}>
                                {regra.ordem}. {regra.nome} <span className="text-tertiary">· r{regra.revisao}</span>
                            </li>
                        ))}
                    </ul>
                    <span className="flex flex-wrap gap-2">
                        {extrato.acoesAplicadas.map((acao) => (
                            <Badge key={`${acao.ordem}-${acao.regraId}`} type="modern" size="sm">
                                {acao.ordem}. {ROTULO_ACAO[acao.acao]}
                                {acao.coluna ? ` em ${acao.coluna}` : ""}
                            </Badge>
                        ))}
                    </span>
                </Section>
            </SplitCard>
            <Card titulo="Alterações por linha" descricao="Linha da versão de entrada, ação de origem e valores anterior e novo.">
                <Table aria-label="Alterações do extrato" size="sm">
                    <Table.Header>
                        <Table.Head id="linha" label="Linha" isRowHeader />
                        <Table.Head id="tipo" label="Tipo" />
                        <Table.Head id="acao" label="Ação" />
                        <Table.Head id="detalhe" label="Detalhe" />
                    </Table.Header>
                    <Table.Body items={alteracoes.itens.map((a, i) => ({ ...a, id: `${a.linha}-${a.coluna ?? "r"}-${i}` }))}>
                        {(alteracao) => (
                            <Table.Row id={alteracao.id}>
                                <Table.Cell>{alteracao.linha}</Table.Cell>
                                <Table.Cell>{alteracao.tipo === "REMOCAO" ? "Remoção" : "Atualização"}</Table.Cell>
                                <Table.Cell>
                                    {ROTULO_ACAO[alteracao.acao]} · r{alteracao.regraRevisao}
                                </Table.Cell>
                                <Table.Cell>
                                    {alteracao.tipo === "REMOCAO" ? (
                                        `Repetia a linha ${alteracao.linhaRepresentante}`
                                    ) : (
                                        <span className="font-mono text-xs whitespace-pre">
                                            {alteracao.coluna}: “{alteracao.valorAnterior}” → “{alteracao.valorNovo}”
                                        </span>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
                <ListPagination
                    pagina={alteracoes.pagina}
                    totalPaginas={Math.max(1, Math.ceil(alteracoes.total / alteracoes.tamanho))}
                    total={alteracoes.total}
                    aoMudar={setPagina}
                />
            </Card>
        </>
    );
}

/** T07 — Extrato de auditoria com exportação em PDF (RF006, RN03, UC-06). */
export function ExtratoTela() {
    const { id } = useParams<{ id: string }>();
    return (
        <PermissionGate operacao="AUDITORIA_CONSULTAR">
            <Detalhe id={id} />
        </PermissionGate>
    );
}
