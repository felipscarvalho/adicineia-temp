"use client";

import { ArrowLeft } from "@untitledui/icons";
import { useParams } from "next/navigation";
import { LoadingIndicator } from "@/components/application/loading-indicator/loading-indicator";
import { Button } from "@/components/base/buttons/button";
import { abreviarHash } from "@/components/datasets/situacao_badge";
import { Alert } from "@/components/feedback/alert";
import { Card, SplitCard } from "@/components/layout/card";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DetailField, Section } from "@/components/layout/section";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { StatusSimulacaoBadge } from "@/components/simulations/status_simulacao";
import { useSimulacao } from "@/hooks/simulations/use_simulacoes";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import type { Simulacao } from "@/types/simulations";
import { PreviaAcoes } from "./previa_acoes";
import { ResultadosRegras } from "./resultados_regras";

function AvisoStatus({ simulacao }: { simulacao: Simulacao }) {
    const segundos = Math.round(simulacao.limiteMs / 1000);
    switch (simulacao.status) {
        case "EM_EXECUCAO":
            return (
                <div className="flex items-center gap-3 rounded-xl glass p-4 ring-1 ring-secondary">
                    <LoadingIndicator type="line-spinner" size="sm" />
                    <p className="text-sm text-secondary">
                        Simulação em execução desde {formatDateTime(simulacao.aceitaEm)}. Ela será cancelada se não terminar em {segundos} segundos. Esta página
                        se atualiza sozinha.
                    </p>
                </div>
            );
        case "TEMPO_ESGOTADO":
            return (
                <Alert variante="aviso" titulo="Tempo esgotado">
                    {simulacao.mensagem ?? `A simulação não terminou em ${segundos} segundos e foi cancelada.`} O resultado incompleto não pode ser aplicado.
                </Alert>
            );
        case "FALHA":
            return (
                <Alert variante="erro" titulo="A simulação falhou">
                    {simulacao.mensagem}
                </Alert>
            );
        case "INVALIDADA":
            return (
                <Alert variante="aviso" titulo="Simulação invalidada">
                    {simulacao.motivoNaoVigente ?? simulacao.mensagem} O histórico abaixo mostra a configuração realmente executada.
                </Alert>
            );
        case "CONSOLIDADA":
            return (
                <Alert variante="sucesso" titulo="Simulação já aplicada">
                    O tratamento desta simulação foi confirmado; ela não pode ser reaplicada.
                </Alert>
            );
        default:
            return simulacao.vigente ? null : (
                <Alert variante="aviso" titulo="Simulação fora de vigência">
                    {simulacao.motivoNaoVigente}
                </Alert>
            );
    }
}

function Detalhe({ id }: { id: string }) {
    const consulta = useSimulacao(id);
    if (consulta.isPending) {
        return <LoadingState />;
    }
    if (consulta.isError) {
        return <ErrorState mensagem={(consulta.error as ApiError).message} aoTentarNovamente={() => void consulta.refetch()} />;
    }
    const simulacao = consulta.data;
    const concluida = simulacao.totalLinhas !== null;
    const integra = simulacao.hashEntradaConferido === simulacao.hashEntrada;

    return (
        <>
            <PageHeader
                titulo={`Simulação da v${simulacao.versaoNumero}`}
                descricao={`${simulacao.conjunto.nome} · revisão ${simulacao.conjunto.revisao}`}
                acoes={
                    <Button color="tertiary" iconLeading={ArrowLeft} href="/simulacoes">
                        Simulações
                    </Button>
                }
            />
            <AvisoStatus simulacao={simulacao} />
            <SplitCard
                aside={
                    <dl className="flex flex-col gap-4">
                        <DetailField rotulo="Situação">
                            <StatusSimulacaoBadge status={simulacao.status} />
                        </DetailField>
                        <DetailField rotulo="Aceita em">{formatDateTime(simulacao.aceitaEm)}</DetailField>
                        <DetailField rotulo="Concluída em">{formatDateTime(simulacao.concluidaEm)}</DetailField>
                        <DetailField rotulo="Limite">{Math.round(simulacao.limiteMs / 1000)} s desde o aceite</DetailField>
                        <DetailField rotulo="SHA-256 da entrada" mono>
                            <span title={simulacao.hashEntrada}>{abreviarHash(simulacao.hashEntrada)}</span>
                            {simulacao.hashEntradaConferido && (
                                <span className={integra ? "block text-success-primary" : "block text-error-primary"}>
                                    {integra ? "Conferido: original intacto" : "Divergente"}
                                </span>
                            )}
                        </DetailField>
                    </dl>
                }
            >
                <Section titulo="Totais">
                    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <DetailField rotulo="Linhas avaliadas">{simulacao.totalLinhas?.toLocaleString("pt-BR") ?? "—"}</DetailField>
                        <DetailField rotulo="Linhas distintas com violação">{simulacao.totalLinhasComViolacao?.toLocaleString("pt-BR") ?? "—"}</DetailField>
                        <DetailField rotulo="Previsão: linhas alteradas">{simulacao.totalPrevistoAlteradas?.toLocaleString("pt-BR") ?? "—"}</DetailField>
                        <DetailField rotulo="Previsão: linhas removidas">{simulacao.totalPrevistoRemovidas?.toLocaleString("pt-BR") ?? "—"}</DetailField>
                    </dl>
                    <p className="text-xs text-quaternary">
                        Uma violação detectada não implica ação corretiva configurada; nenhum dado foi alterado pela simulação.
                    </p>
                </Section>
            </SplitCard>
            {concluida && (
                <>
                    <Card titulo="Violações por regra" descricao="Identificadores das linhas na ordem original do arquivo.">
                        <ResultadosRegras resultados={simulacao.resultados} />
                    </Card>
                    <Card titulo="Prévia das alterações" descricao="Até 20 linhas, com valores antes e depois das ações do catálogo.">
                        <PreviaAcoes previa={simulacao.previa} />
                    </Card>
                </>
            )}
        </>
    );
}

/** T04 — Resultado da simulação (RF003, UC-03, ADR-008). */
export function SimulacaoDetalheTela() {
    const { id } = useParams<{ id: string }>();
    return (
        <PermissionGate operacao="SIMULACAO_CONSULTAR">
            <Detalhe id={id} />
        </PermissionGate>
    );
}
