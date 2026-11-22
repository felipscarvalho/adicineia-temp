"use client";

import { useMemo, useState } from "react";
import { Download01, PlayCircle } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Select } from "@/components/base/select/select";
import { abreviarHash } from "@/components/datasets/situacao_badge";
import { Alert } from "@/components/feedback/alert";
import { Card } from "@/components/layout/card";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DetailField } from "@/components/layout/section";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { useDiagnostico, useExportarDiagnostico, useVersoesAvaliaveis } from "@/hooks/diagnostics/use_diagnosticos";
import { usePermissions } from "@/hooks/use_permissions";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import type { FormatoExportacao } from "@/types/diagnostics";
import { CartaoIndicador } from "./cartao_indicador";

function Painel({ versaoId }: { versaoId: string }) {
    const { can } = usePermissions();
    const consulta = useDiagnostico(versaoId);
    const exportar = useExportarDiagnostico();
    const [formato, setFormato] = useState<FormatoExportacao | null>(null);

    if (consulta.isPending) {
        return <LoadingState rotulo="Calculando indicadores..." />;
    }
    if (consulta.isError) {
        const erro = consulta.error as ApiError;
        if (erro.codigo === "SEM_AVALIACAO" || erro.codigo === "AVALIACAO_DESATUALIZADA") {
            return (
                <Alert
                    variante={erro.codigo === "SEM_AVALIACAO" ? "info" : "aviso"}
                    titulo={erro.codigo === "SEM_AVALIACAO" ? "Versão sem avaliação" : "Avaliação desatualizada"}
                >
                    <p>{erro.message}</p>
                    {can("SIMULACAO_EXECUTAR") && (
                        <div className="mt-3">
                            <Button size="sm" color="secondary" className="glass-control" iconLeading={PlayCircle} href="/simulacoes">
                                Ir para simulações
                            </Button>
                        </div>
                    )}
                </Alert>
            );
        }
        return <ErrorState mensagem={erro.message} aoTentarNovamente={() => void consulta.refetch()} />;
    }

    const diagnostico = consulta.data;
    const baixar = (alvo: FormatoExportacao) => {
        setFormato(alvo);
        exportar.mutate({ versaoId, formato: alvo }, { onSettled: () => setFormato(null) });
    };

    return (
        <>
            <Card
                titulo={`${diagnostico.dataset.nome} · v${diagnostico.versao.numero}`}
                descricao={`Avaliado em ${formatDateTime(diagnostico.avaliadoEm)} com ${diagnostico.conjunto.nome} (revisão ${diagnostico.conjunto.revisao}).`}
                acoes={
                    can("DIAGNOSTICO_EXPORTAR") && (
                        <>
                            <Button
                                size="sm"
                                color="secondary"
                                className="glass-control"
                                iconLeading={Download01}
                                isLoading={formato === "PDF"}
                                onClick={() => baixar("PDF")}
                            >
                                Exportar PDF
                            </Button>
                            <Button
                                size="sm"
                                color="secondary"
                                className="glass-control"
                                iconLeading={Download01}
                                isLoading={formato === "XLSX"}
                                onClick={() => baixar("XLSX")}
                            >
                                Exportar XLSX
                            </Button>
                        </>
                    )
                }
            >
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailField rotulo="Cobertura">
                        <Badge type="pill-color" color={diagnostico.cobertura.situacao === "COMPLETA" ? "success" : "warning"} size="sm">
                            {diagnostico.cobertura.dimensoesAvaliadas} de {diagnostico.cobertura.totalDimensoes} dimensões ·{" "}
                            {diagnostico.cobertura.situacao === "COMPLETA" ? "completa" : "parcial"}
                        </Badge>
                    </DetailField>
                    <DetailField rotulo="Total de linhas da versão">{diagnostico.totalLinhas.toLocaleString("pt-BR")}</DetailField>
                    <DetailField rotulo="SHA-256 da versão" mono>
                        <span title={diagnostico.versao.hashSha256}>{abreviarHash(diagnostico.versao.hashSha256)}</span>
                    </DetailField>
                    <DetailField rotulo="Simulação de origem" mono>
                        {diagnostico.simulacaoId}
                    </DetailField>
                </dl>
            </Card>
            <section aria-label="Indicadores" className="grid gap-4 lg:grid-cols-3">
                {diagnostico.indicadores.map((indicador) => (
                    <CartaoIndicador key={indicador.dimensao} indicador={indicador} />
                ))}
            </section>
            <p className="text-sm text-tertiary">{diagnostico.aviso}</p>
        </>
    );
}

function Diagnosticos() {
    const versoes = useVersoesAvaliaveis();
    const [versaoId, setVersaoId] = useState<string | null>(null);
    const itens = useMemo(
        () =>
            (versoes.data ?? []).map((v) => ({
                id: v.versaoId,
                label: `${v.datasetNome} · v${v.numero}`,
                supportingText: v.possuiAvaliacao ? "avaliada" : "sem avaliação",
            })),
        [versoes.data],
    );

    return (
        <>
            <PageHeader
                titulo="Diagnóstico de qualidade"
                descricao="Unicidade, completude e validade da versão avaliada, com as regras e a cobertura da avaliação."
            />
            <Card>
                <div className="md:w-[28rem]">
                    <Select
                        label="Versão do dataset"
                        placeholder="Selecione a versão avaliada"
                        items={itens}
                        selectedKey={versaoId}
                        onSelectionChange={(chave) => setVersaoId(chave ? String(chave) : null)}
                    >
                        {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                </div>
            </Card>
            {versaoId && <Painel key={versaoId} versaoId={versaoId} />}
        </>
    );
}

/** T06 — Dashboard com três indicadores e cobertura (RF005, RN01, UC-07). */
export function DiagnosticoTela() {
    return (
        <PermissionGate operacao="DIAGNOSTICO_CONSULTAR">
            <Diagnosticos />
        </PermissionGate>
    );
}
