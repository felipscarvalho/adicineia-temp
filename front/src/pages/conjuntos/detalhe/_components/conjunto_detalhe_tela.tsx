import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Trash01 } from "@untitledui/icons";
import { useNavigate, useParams } from "react-router";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { FormInput, FormTextArea } from "@/components/forms/form_input";
import { Card, SplitCard } from "@/components/layout/card";
import { FormActions } from "@/components/layout/form_actions";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { DetailField, Section } from "@/components/layout/section";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { ConfirmModal } from "@/components/overlays/confirm_modal";
import { OrdemRegras } from "@/components/rules/ordem_regras";
import { useAtualizarConjunto, useConjunto, useExcluirConjunto, useRevisoesConjunto } from "@/hooks/rules/use_conjuntos";
import { useRegras } from "@/hooks/rules/use_regras";
import { useEditForm } from "@/hooks/use_edit_form";
import { usePermissions } from "@/hooks/use_permissions";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import { type ConjuntoForm, conjuntoSchema } from "@/schemas/rules/conjunto";
import type { Conjunto, Regra } from "@/types/rules/regra";
import { DatasetsAssociados } from "./datasets_associados";

const MOTIVO: Record<string, string> = { CRIACAO: "Criação", EDICAO_CONJUNTO: "Edição do conjunto", REVISAO_REGRA: "Revisão de regra" };

function Formulario({ conjunto, regras, editavel }: { conjunto: Conjunto; regras: Regra[]; editavel: boolean }) {
    const atualizar = useAtualizarConjunto(conjunto.id);
    const [erro, setErro] = useState<ApiError | null>(null);
    const formulario = useEditForm<ConjuntoForm>({
        salvos: { nome: conjunto.nome, descricao: conjunto.descricao, regras: conjunto.regras.map((r) => r.regraId) },
        resolver: zodResolver(conjuntoSchema),
    });
    // Regras já excluídas continuam listadas pelo nome da revisão usada no conjunto.
    const conhecidas = [
        ...regras,
        ...conjunto.regras.filter((r) => !regras.some((x) => x.id === r.regraId)).map((r) => ({ ...r, id: r.regraId }) as unknown as Regra),
    ];

    const salvar = formulario.handleSubmit((dados) => {
        setErro(null);
        atualizar.mutate(dados, {
            onSuccess: (salvo) => toast.success(`Revisão ${salvo.revisao} do conjunto salva`, "Simulações anteriores deste conjunto deixaram de valer."),
            onError: (falha) => setErro(falha as ApiError),
        });
    });

    return (
        <form noValidate onSubmit={salvar} className="flex flex-col gap-6">
            {erro && (
                <Alert variante="erro" titulo={erro.message}>
                    {erro.errosDeCampo.map((e) => (
                        <p key={e.campo + e.mensagem}>{e.mensagem}</p>
                    ))}
                </Alert>
            )}
            <Section titulo="Identificação">
                {editavel ? (
                    <>
                        <FormInput control={formulario.control} name="nome" label="Nome" isRequired />
                        <FormTextArea control={formulario.control} name="descricao" label="Descrição" rows={2} />
                    </>
                ) : (
                    <dl className="grid gap-4 md:grid-cols-2">
                        <DetailField rotulo="Nome">{conjunto.nome}</DetailField>
                        <DetailField rotulo="Descrição">{conjunto.descricao || "—"}</DetailField>
                    </dl>
                )}
            </Section>
            <Section titulo="Regras e ordem de execução" descricao="Duas ações de escrita na mesma coluna ou nomes repetidos são recusados.">
                <OrdemRegras control={formulario.control} regras={conhecidas} somenteLeitura={!editavel} />
            </Section>
            {editavel && <FormActions alterado={formulario.alterado} salvando={atualizar.isPending} aoDescartar={formulario.discard} />}
        </form>
    );
}

function Detalhe({ id }: { id: string }) {
    const navegar = useNavigate();
    const { can } = usePermissions();
    const conjunto = useConjunto(id);
    const regras = useRegras();
    const revisoes = useRevisoesConjunto(id);
    const excluir = useExcluirConjunto(id);
    const [confirmando, setConfirmando] = useState(false);

    if (conjunto.isPending || regras.isPending) {
        return <LoadingState />;
    }
    if (conjunto.isError) {
        return <ErrorState mensagem={(conjunto.error as ApiError).message} aoTentarNovamente={() => void conjunto.refetch()} />;
    }
    const ativo = conjunto.data.situacao === "ATIVO";

    return (
        <>
            <PageHeader
                titulo={conjunto.data.nome}
                descricao={`${conjunto.data.regras.length} regra(s) · revisão ${conjunto.data.revisao}`}
                acoes={
                    <>
                        <Button color="tertiary" iconLeading={ArrowLeft} href="/conjuntos">
                            Conjuntos
                        </Button>
                        {ativo && can("CONJUNTO_MANTER") && (
                            <Button color="secondary-destructive" iconLeading={Trash01} onClick={() => setConfirmando(true)}>
                                Excluir
                            </Button>
                        )}
                    </>
                }
            />
            {!ativo && (
                <Alert variante="aviso" titulo="Conjunto excluído logicamente">
                    Ele não pode ser simulado; revisões e extratos que o referenciam continuam consultáveis.
                </Alert>
            )}
            <SplitCard
                aside={
                    <dl className="flex flex-col gap-4">
                        <DetailField rotulo="Revisão atual">r{conjunto.data.revisao}</DetailField>
                        <DetailField rotulo="Datasets associados">{conjunto.data.datasets.length}</DetailField>
                        <DetailField rotulo="Atualizado em">{formatDateTime(conjunto.data.atualizadoEm)}</DetailField>
                    </dl>
                }
            >
                <Formulario conjunto={conjunto.data} regras={regras.data ?? []} editavel={ativo && can("CONJUNTO_MANTER")} />
            </SplitCard>
            <Card titulo="Datasets associados" descricao="A simulação exige que o conjunto esteja associado ao dataset.">
                <DatasetsAssociados conjunto={conjunto.data} editavel={ativo && can("CONJUNTO_ASSOCIAR")} />
            </Card>
            <Card titulo="Revisões" descricao="Cada alteração do conjunto ou de suas regras gera uma revisão imutável.">
                {revisoes.data && (
                    <Table aria-label="Revisões do conjunto" size="sm">
                        <Table.Header>
                            <Table.Head id="revisao" label="Revisão" isRowHeader />
                            <Table.Head id="motivo" label="Motivo" />
                            <Table.Head id="regras" label="Regras" />
                            <Table.Head id="criada" label="Criada em" />
                        </Table.Header>
                        <Table.Body items={[...revisoes.data].reverse().map((r) => ({ ...r, id: r.revisao }))}>
                            {(revisao) => (
                                <Table.Row id={revisao.revisao}>
                                    <Table.Cell>r{revisao.revisao}</Table.Cell>
                                    <Table.Cell>{MOTIVO[revisao.motivo] ?? revisao.motivo}</Table.Cell>
                                    <Table.Cell>{revisao.itens.length}</Table.Cell>
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
                titulo="Excluir conjunto logicamente?"
                descricao="As simulações pendentes deste conjunto deixam de valer. Revisões e extratos permanecem."
                rotuloConfirmar="Excluir"
                destrutivo
                confirmando={excluir.isPending}
                aoConfirmar={() =>
                    excluir.mutate(undefined, {
                        onSuccess: () => {
                            toast.success("Conjunto excluído logicamente");
                            navegar("/conjuntos");
                        },
                        onSettled: () => setConfirmando(false),
                    })
                }
            />
        </>
    );
}

/** T02 — Detalhe do conjunto: ordem das regras, associação e revisões (RF002, MOD-16). */
export function ConjuntoDetalheTela() {
    const { id = "" } = useParams<{ id: string }>();
    return (
        <PermissionGate operacao="CONJUNTO_CONSULTAR">
            <Detalhe id={id} />
        </PermissionGate>
    );
}
