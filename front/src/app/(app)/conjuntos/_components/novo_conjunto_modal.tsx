"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { FormInput, FormTextArea } from "@/components/forms/form_input";
import { FormModal } from "@/components/overlays/form_modal";
import { OrdemRegras } from "@/components/rules/ordem_regras";
import { useCriarConjunto } from "@/hooks/rules/use_conjuntos";
import { useRegras } from "@/hooks/rules/use_regras";
import { useOpenSession } from "@/hooks/use_open_session";
import type { ApiError } from "@/lib/api";
import { type ConjuntoForm, conjuntoSchema } from "@/schemas/rules/conjunto";

function Conteudo({ aoFechar }: { aoFechar: () => void }) {
    const regras = useRegras();
    const criar = useCriarConjunto();
    const [erro, setErro] = useState<ApiError | null>(null);
    const { control, handleSubmit } = useForm<ConjuntoForm>({ resolver: zodResolver(conjuntoSchema), defaultValues: { nome: "", descricao: "", regras: [] } });

    const enviar = handleSubmit((dados) => {
        setErro(null);
        criar.mutate(dados, {
            onSuccess: (conjunto) => {
                toast.success("Conjunto criado", `${conjunto.nome} com ${conjunto.regras.length} regra(s).`);
                aoFechar();
            },
            onError: (falha) => setErro(falha as ApiError),
        });
    });

    return (
        <FormModal
            isOpen
            aoFechar={aoFechar}
            titulo="Novo conjunto de regras"
            rotuloEnviar="Criar conjunto"
            enviando={criar.isPending}
            aoEnviar={enviar}
            largura="max-w-2xl"
        >
            {erro && (
                <Alert variante="erro" titulo={erro.message}>
                    {erro.errosDeCampo.map((e) => (
                        <p key={e.campo + e.mensagem}>{e.mensagem}</p>
                    ))}
                </Alert>
            )}
            <FormInput control={control} name="nome" label="Nome" isRequired />
            <FormTextArea control={control} name="descricao" label="Descrição" rows={2} />
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-secondary">Regras, na ordem de execução</span>
                <OrdemRegras control={control} regras={regras.data ?? []} />
            </div>
        </FormModal>
    );
}

/** Criação de conjunto com ordem explícita (RF002, UC-02 passo 7). */
export function NovoConjuntoModal({ isOpen, aoFechar }: { isOpen: boolean; aoFechar: () => void }) {
    const sessao = useOpenSession(isOpen);
    return isOpen ? <Conteudo key={sessao} aoFechar={aoFechar} /> : null;
}
