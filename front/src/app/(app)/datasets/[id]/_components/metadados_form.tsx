"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/components/feedback/toast";
import { FormInput, FormTextArea } from "@/components/forms/form_input";
import { FormActions } from "@/components/layout/form_actions";
import { DetailField } from "@/components/layout/section";
import { useAtualizarMetadados } from "@/hooks/datasets/use_datasets";
import { useEditForm } from "@/hooks/use_edit_form";
import { type MetadadosForm, metadadosSchema } from "@/schemas/datasets/metadados";
import type { DatasetDetalhe } from "@/types/datasets";

/** Edição direta de nome e descrição (UC-01, fluxo 5a); quem não pode editar vê só leitura. */
export function MetadadosFormulario({ dataset, editavel }: { dataset: DatasetDetalhe; editavel: boolean }) {
    const atualizar = useAtualizarMetadados(dataset.id);
    const formulario = useEditForm<MetadadosForm>({ salvos: { nome: dataset.nome, descricao: dataset.descricao }, resolver: zodResolver(metadadosSchema) });

    if (!editavel) {
        return (
            <dl className="grid gap-4 md:grid-cols-2">
                <DetailField rotulo="Nome">{dataset.nome}</DetailField>
                <DetailField rotulo="Descrição">{dataset.descricao || "—"}</DetailField>
            </dl>
        );
    }

    const salvar = formulario.handleSubmit((dados) =>
        atualizar.mutate(dados, { onSuccess: () => toast.success("Metadados atualizados", "O conteúdo e as versões não foram alterados.") }),
    );

    return (
        <form noValidate onSubmit={salvar} className="flex flex-col gap-4">
            <FormInput control={formulario.control} name="nome" label="Nome" isRequired />
            <FormTextArea control={formulario.control} name="descricao" label="Descrição" rows={3} />
            <FormActions alterado={formulario.alterado} salvando={atualizar.isPending} aoDescartar={formulario.discard} />
        </form>
    );
}
