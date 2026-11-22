import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CampoArquivoCsv } from "@/components/datasets/campo_arquivo_csv";
import { ITENS_SEPARADOR } from "@/components/datasets/itens_separador";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { FormInput, FormTextArea } from "@/components/forms/form_input";
import { FormSelect } from "@/components/forms/form_select";
import { FormModal } from "@/components/overlays/form_modal";
import { useImportarDataset } from "@/hooks/datasets/use_datasets";
import { useOpenSession } from "@/hooks/use_open_session";
import type { ApiError } from "@/lib/api";
import { type ImportarDatasetForm, importarDatasetSchema } from "@/schemas/datasets/importar_dataset";

function Conteudo({ aoFechar }: { aoFechar: () => void }) {
    const importar = useImportarDataset();
    const [erro, setErro] = useState<ApiError | null>(null);
    const { control, handleSubmit } = useForm<ImportarDatasetForm>({
        resolver: zodResolver(importarDatasetSchema),
        defaultValues: { nome: "", descricao: "", separador: "VIRGULA", arquivo: undefined },
    });

    const enviar = handleSubmit((dados) => {
        setErro(null);
        importar.mutate(dados, {
            onSuccess: (dataset) => {
                toast.success("Dataset importado", `${dataset.nome}: versão 1 com ${dataset.versaoAtual?.totalRegistros.toLocaleString("pt-BR")} registros.`);
                aoFechar();
            },
            onError: (falha) => setErro(falha as ApiError),
        });
    });

    return (
        <FormModal
            isOpen
            aoFechar={aoFechar}
            titulo="Importar dataset"
            descricao="O arquivo é validado no servidor e guardado sem alterações; se for rejeitado, nada é gravado."
            rotuloEnviar="Importar"
            enviando={importar.isPending}
            aoEnviar={enviar}
        >
            {erro && (
                <Alert variante="erro" titulo="Arquivo rejeitado">
                    {erro.message}
                </Alert>
            )}
            <FormInput control={control} name="nome" label="Nome" isRequired placeholder="Ex.: Atendimentos ambulatoriais 2025" />
            <FormTextArea
                control={control}
                name="descricao"
                label="Descrição"
                rows={3}
                placeholder="Origem, licença e verificação de ausência de dados pessoais"
            />
            <FormSelect control={control} name="separador" label="Separador" itens={ITENS_SEPARADOR} isRequired />
            <CampoArquivoCsv control={control} name="arquivo" />
        </FormModal>
    );
}

/** Importação de CSV (RF001, UC-01 passos 2–4). */
export function ImportarDatasetModal({ isOpen, aoFechar }: { isOpen: boolean; aoFechar: () => void }) {
    const sessao = useOpenSession(isOpen);
    return isOpen ? <Conteudo key={sessao} aoFechar={aoFechar} /> : null;
}
