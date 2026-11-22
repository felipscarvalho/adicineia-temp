"use client";

import { useState } from "react";
import { ArrowLeft, Trash01, UploadCloud02 } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { SituacaoBadge, abreviarHash } from "@/components/datasets/situacao_badge";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { Card, SplitCard } from "@/components/layout/card";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DetailField, DetailTags, Section } from "@/components/layout/section";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { ConfirmModal } from "@/components/overlays/confirm_modal";
import { useDataset, useExcluirDataset } from "@/hooks/datasets/use_datasets";
import { usePermissions } from "@/hooks/use_permissions";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import { MetadadosFormulario } from "./metadados_form";
import { NovaVersaoModal } from "./nova_versao_modal";
import { RegistrosVersao } from "./registros_versao";
import { TabelaVersoes } from "./tabela_versoes";

function Detalhe({ id }: { id: string }) {
    const router = useRouter();
    const { can } = usePermissions();
    const consulta = useDataset(id);
    const excluir = useExcluirDataset(id);
    const [versaoSelecionada, setVersaoSelecionada] = useState<string | null>(null);
    const [novaVersao, setNovaVersao] = useState(false);
    const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

    if (consulta.isPending) {
        return <LoadingState />;
    }
    if (consulta.isError) {
        return <ErrorState mensagem={(consulta.error as ApiError).message} aoTentarNovamente={() => consulta.refetch()} />;
    }

    const dataset = consulta.data;
    const ativo = dataset.situacao === "ATIVO";
    const atual = dataset.versaoAtual;
    const exibida = versaoSelecionada ?? atual?.id ?? null;

    return (
        <>
            <PageHeader
                titulo={dataset.nome}
                descricao={`${dataset.totalVersoes} versão(ões) · atualizado em ${formatDateTime(dataset.atualizadoEm)}`}
                acoes={
                    <>
                        <Button color="tertiary" iconLeading={ArrowLeft} href="/datasets">
                            Datasets
                        </Button>
                        {ativo && can("DATASET_NOVA_VERSAO") && (
                            <Button color="secondary" className="glass-control" iconLeading={UploadCloud02} onClick={() => setNovaVersao(true)}>
                                Nova versão
                            </Button>
                        )}
                        {ativo && can("DATASET_EXCLUIR") && (
                            <Button color="secondary-destructive" className="glass-control" iconLeading={Trash01} onClick={() => setConfirmandoExclusao(true)}>
                                Excluir
                            </Button>
                        )}
                    </>
                }
            />
            {!ativo && (
                <Alert variante="aviso" titulo="Dataset excluído logicamente">
                    Ele saiu da listagem ativa e não aceita novas operações. Arquivo original, versões e extratos de auditoria continuam preservados para
                    consulta.
                </Alert>
            )}
            <SplitCard
                aside={
                    <dl className="flex flex-col gap-4">
                        <DetailField rotulo="Situação">
                            <SituacaoBadge situacao={dataset.situacao} />
                        </DetailField>
                        <DetailField rotulo="Versão atual">
                            {atual ? `v${atual.numero} · ${atual.totalRegistros.toLocaleString("pt-BR")} registros` : "—"}
                        </DetailField>
                        <DetailField rotulo="SHA-256 da versão atual" mono>
                            {atual ? <span title={atual.hashSha256}>{abreviarHash(atual.hashSha256)}</span> : "—"}
                        </DetailField>
                        <DetailField rotulo="Criado em">{formatDateTime(dataset.criadoEm)}</DetailField>
                    </dl>
                }
            >
                <Section titulo="Metadados" descricao="Nome e descrição podem mudar sem alterar o conteúdo do arquivo.">
                    <MetadadosFormulario dataset={dataset} editavel={ativo && can("DATASET_EDITAR_METADADOS")} />
                </Section>
                {atual && (
                    <Section titulo="Estrutura da versão atual">
                        <DetailTags rotulo={`${atual.totalColunas} colunas (separador "${atual.separador}")`} valores={atual.colunas} />
                    </Section>
                )}
            </SplitCard>
            <Card titulo="Versões" descricao="Versões são somente inseridas; o original nunca é alterado.">
                <TabelaVersoes versoes={dataset.versoes} selecionada={exibida} aoSelecionar={setVersaoSelecionada} />
            </Card>
            {exibida && (
                <Card
                    titulo={`Registros da v${dataset.versoes.find((v) => v.id === exibida)?.numero}`}
                    descricao="Numeração das linhas de dados na ordem original do arquivo."
                >
                    <RegistrosVersao key={exibida} datasetId={dataset.id} versaoId={exibida} />
                </Card>
            )}
            <NovaVersaoModal datasetId={dataset.id} isOpen={novaVersao} aoFechar={() => setNovaVersao(false)} />
            <ConfirmModal
                isOpen={confirmandoExclusao}
                aoFechar={() => setConfirmandoExclusao(false)}
                titulo="Excluir dataset logicamente?"
                descricao="O dataset sai da listagem ativa e deixa de aceitar operações. Versões, arquivos e auditoria permanecem preservados."
                rotuloConfirmar="Excluir"
                destrutivo
                confirmando={excluir.isPending}
                aoConfirmar={() =>
                    excluir.mutate(undefined, {
                        onSuccess: () => {
                            toast.success("Dataset excluído logicamente");
                            setConfirmandoExclusao(false);
                            router.push("/datasets");
                        },
                    })
                }
            />
        </>
    );
}

/** T01 — Detalhe do dataset: metadados, versões, nova versão, exclusão lógica e registros (RF001, RN04). */
export function DatasetDetalheTela() {
    const { id } = useParams<{ id: string }>();
    return (
        <PermissionGate operacao="DATASET_CONSULTAR">
            <Detalhe id={id} />
        </PermissionGate>
    );
}
