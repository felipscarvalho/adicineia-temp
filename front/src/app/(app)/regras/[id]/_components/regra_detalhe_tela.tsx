"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Trash01 } from "@untitledui/icons";
import { useParams, useRouter } from "next/navigation";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { Card, SplitCard } from "@/components/layout/card";
import { FormActions } from "@/components/layout/form_actions";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DetailField } from "@/components/layout/section";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { ConfirmModal } from "@/components/overlays/confirm_modal";
import { aplicarErrosServidor } from "@/components/rules/aplicar_erros_servidor";
import { descreverRegra } from "@/components/rules/descricao_regra";
import { DimensaoBadge } from "@/components/rules/dimensao_badge";
import { RegraCampos } from "@/components/rules/regra_campos";
import { useAtualizarRegra, useCatalogo, useExcluirRegra, useRegra, useRevisoesRegra } from "@/hooks/rules/use_regras";
import { useVocabularios } from "@/hooks/rules/use_vocabularios";
import { useEditForm } from "@/hooks/use_edit_form";
import { usePermissions } from "@/hooks/use_permissions";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import { type RegraForm, campoDoFormulario, paraConfiguracao, paraFormulario, regraFormSchema } from "@/schemas/rules/regra";
import type { Catalogo, Regra } from "@/types/rules/regra";
import type { Vocabulario } from "@/types/rules/vocabulario";

function Formulario({ regra, catalogo, vocabularios, editavel }: { regra: Regra; catalogo: Catalogo; vocabularios: Vocabulario[]; editavel: boolean }) {
    const atualizar = useAtualizarRegra(regra.id);
    const [erros, setErros] = useState<string[]>([]);
    const formulario = useEditForm<RegraForm>({ salvos: paraFormulario(regra), resolver: zodResolver(regraFormSchema) });

    const salvar = formulario.handleSubmit((dados) => {
        setErros([]);
        atualizar.mutate(
            { nome: dados.nome, descricao: dados.descricao, configuracao: paraConfiguracao(dados) },
            {
                onSuccess: (salva) =>
                    toast.success(
                        `Revisão ${salva.revisao} salva`,
                        "Os conjuntos que usam a regra foram revisados e as simulações anteriores deixaram de valer.",
                    ),
                onError: (falha) => {
                    const erro = falha as ApiError;
                    setErros([erro.message, ...aplicarErrosServidor(erro, formulario.setError, campoDoFormulario)]);
                },
            },
        );
    });

    return (
        <form noValidate onSubmit={salvar} className="flex flex-col gap-6">
            {erros.length > 0 && (
                <Alert variante="erro" titulo={erros[0]}>
                    {erros.slice(1).map((mensagem) => (
                        <p key={mensagem}>{mensagem}</p>
                    ))}
                </Alert>
            )}
            <RegraCampos control={formulario.control} catalogo={catalogo} vocabularios={vocabularios} somenteLeitura={!editavel} />
            {editavel && <FormActions alterado={formulario.alterado} salvando={atualizar.isPending} aoDescartar={formulario.discard} />}
        </form>
    );
}

function Detalhe({ id }: { id: string }) {
    const router = useRouter();
    const { can } = usePermissions();
    const regra = useRegra(id);
    const revisoes = useRevisoesRegra(id);
    const catalogo = useCatalogo();
    const vocabularios = useVocabularios(can("VOCABULARIO_CONSULTAR"));
    const excluir = useExcluirRegra(id);
    const [confirmando, setConfirmando] = useState(false);

    if (regra.isPending || catalogo.isPending) {
        return <LoadingState />;
    }
    if (regra.isError || catalogo.isError) {
        return <ErrorState mensagem={((regra.error ?? catalogo.error) as ApiError).message} aoTentarNovamente={() => void regra.refetch()} />;
    }
    const ativa = regra.data.situacao === "ATIVO";

    return (
        <>
            <PageHeader
                titulo={regra.data.nome}
                descricao={descreverRegra(regra.data.configuracao)}
                acoes={
                    <>
                        <Button color="tertiary" iconLeading={ArrowLeft} href="/regras">
                            Regras
                        </Button>
                        {ativa && can("REGRA_MANTER") && (
                            <Button color="secondary-destructive" className="glass-control" iconLeading={Trash01} onClick={() => setConfirmando(true)}>
                                Excluir
                            </Button>
                        )}
                    </>
                }
            />
            {!ativa && (
                <Alert variante="aviso" titulo="Regra excluída logicamente">
                    As revisões continuam consultáveis por simulações e extratos que as referenciam.
                </Alert>
            )}
            <SplitCard
                aside={
                    <dl className="flex flex-col gap-4">
                        <DetailField rotulo="Dimensão">
                            <DimensaoBadge dimensao={regra.data.dimensao} />
                        </DetailField>
                        <DetailField rotulo="Revisão atual">r{regra.data.revisao}</DetailField>
                        <DetailField rotulo="Atualizada em">{formatDateTime(regra.data.atualizadoEm)}</DetailField>
                    </dl>
                }
            >
                <Formulario regra={regra.data} catalogo={catalogo.data} vocabularios={vocabularios.data ?? []} editavel={ativa && can("REGRA_MANTER")} />
            </SplitCard>
            <Card titulo="Revisões" descricao="Cada edição cria uma revisão imutável (ADR-005).">
                {revisoes.data && (
                    <Table aria-label="Revisões da regra" size="sm">
                        <Table.Header>
                            <Table.Head id="revisao" label="Revisão" isRowHeader />
                            <Table.Head id="configuracao" label="Configuração" />
                            <Table.Head id="criada" label="Criada em" />
                        </Table.Header>
                        <Table.Body items={[...revisoes.data].reverse().map((r) => ({ ...r, id: r.revisao }))}>
                            {(revisao) => (
                                <Table.Row id={revisao.revisao}>
                                    <Table.Cell>r{revisao.revisao}</Table.Cell>
                                    <Table.Cell>
                                        <span className="font-mono text-xs">{descreverRegra(revisao.configuracao)}</span>
                                    </Table.Cell>
                                    <Table.Cell>{formatDateTime(revisao.criadoEm)}</Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                )}
            </Card>
            <ConfirmModal
                isOpen={confirmando}
                aoFechar={() => setConfirmando(false)}
                titulo="Excluir regra logicamente?"
                descricao="A regra precisa estar fora de conjuntos ativos. As revisões continuam consultáveis."
                rotuloConfirmar="Excluir"
                destrutivo
                confirmando={excluir.isPending}
                aoConfirmar={() =>
                    excluir.mutate(undefined, {
                        onSuccess: () => {
                            toast.success("Regra excluída logicamente");
                            setConfirmando(false);
                            router.push("/regras");
                        },
                        onSettled: () => setConfirmando(false),
                    })
                }
            />
        </>
    );
}

/** T03 — Configuração de regra visual com edição direta e revisões (RF002, UC-02). */
export function RegraDetalheTela() {
    const { id } = useParams<{ id: string }>();
    return (
        <PermissionGate operacao="REGRA_CONSULTAR">
            <Detalhe id={id} />
        </PermissionGate>
    );
}
