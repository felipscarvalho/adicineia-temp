"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CampoArquivoCsv } from "@/components/datasets/campo_arquivo_csv";
import { ITENS_SEPARADOR } from "@/components/datasets/itens_separador";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { FormSelect } from "@/components/forms/form_select";
import { FormModal } from "@/components/overlays/form_modal";
import { useImportarNovaVersao } from "@/hooks/datasets/use_datasets";
import { useOpenSession } from "@/hooks/use_open_session";
import type { ApiError } from "@/lib/api";
import { type NovaVersaoForm, novaVersaoSchema } from "@/schemas/datasets/metadados";

function Conteudo({ datasetId, aoFechar }: { datasetId: string; aoFechar: () => void }) {
    const importar = useImportarNovaVersao(datasetId);
    const [erro, setErro] = useState<ApiError | null>(null);
    const { control, handleSubmit } = useForm<NovaVersaoForm>({
        resolver: zodResolver(novaVersaoSchema),
        defaultValues: { separador: "VIRGULA", arquivo: undefined },
    });

    const enviar = handleSubmit((dados) => {
        setErro(null);
        importar.mutate(dados, {
            onSuccess: (versao) => {
                toast.success(`Versão ${versao.numero} criada`, "O conteúdo anterior foi preservado.");
                aoFechar();
            },
            onError: (falha) => setErro(falha as ApiError),
        });
    });

    return (
        <FormModal
            isOpen
            aoFechar={aoFechar}
            titulo="Importar nova versão"
            descricao="O novo conteúdo vira uma versão ligada à mais recente; nenhuma versão existente é sobrescrita."
            rotuloEnviar="Importar versão"
            enviando={importar.isPending}
            aoEnviar={enviar}
        >
            {erro && (
                <Alert variante="erro" titulo="Arquivo rejeitado">
                    {erro.message}
                </Alert>
            )}
            <FormSelect control={control} name="separador" label="Separador" itens={ITENS_SEPARADOR} isRequired />
            <CampoArquivoCsv control={control} name="arquivo" />
        </FormModal>
    );
}

/** Nova versão por importação (UC-01, fluxo 5b). */
export function NovaVersaoModal({ datasetId, isOpen, aoFechar }: { datasetId: string; isOpen: boolean; aoFechar: () => void }) {
    const sessao = useOpenSession(isOpen);
    return isOpen ? <Conteudo key={sessao} datasetId={datasetId} aoFechar={aoFechar} /> : null;
}
