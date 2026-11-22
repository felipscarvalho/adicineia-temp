"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { LoadingState } from "@/components/layout/states";
import { FormModal } from "@/components/overlays/form_modal";
import { aplicarErrosServidor } from "@/components/rules/aplicar_erros_servidor";
import { RegraCampos } from "@/components/rules/regra_campos";
import { useCatalogo, useCriarRegra } from "@/hooks/rules/use_regras";
import { useVocabularios } from "@/hooks/rules/use_vocabularios";
import { useOpenSession } from "@/hooks/use_open_session";
import type { ApiError } from "@/lib/api";
import { type RegraForm, campoDoFormulario, paraConfiguracao, regraFormSchema, regraFormVazio } from "@/schemas/rules/regra";

function Conteudo({ aoFechar }: { aoFechar: () => void }) {
    const catalogo = useCatalogo();
    const vocabularios = useVocabularios();
    const criar = useCriarRegra();
    const [erros, setErros] = useState<string[]>([]);
    const { control, handleSubmit, setError } = useForm<RegraForm>({ resolver: zodResolver(regraFormSchema), defaultValues: regraFormVazio });

    const enviar = handleSubmit((dados) => {
        setErros([]);
        criar.mutate(
            { nome: dados.nome, descricao: dados.descricao, configuracao: paraConfiguracao(dados) },
            {
                onSuccess: (regra) => {
                    toast.success("Regra criada", `${regra.nome} — revisão ${regra.revisao}.`);
                    aoFechar();
                },
                onError: (falha) => {
                    const erro = falha as ApiError;
                    const restantes = aplicarErrosServidor(erro, setError, campoDoFormulario);
                    setErros([erro.message, ...restantes]);
                },
            },
        );
    });

    return (
        <FormModal
            isOpen
            aoFechar={aoFechar}
            titulo="Nova regra"
            descricao="Configuração visual do catálogo fechado (seção 8.3 da P1)."
            rotuloEnviar="Criar regra"
            enviando={criar.isPending}
            aoEnviar={enviar}
            largura="max-w-3xl"
        >
            {erros.length > 0 && (
                <Alert variante="erro" titulo={erros[0]}>
                    {erros.slice(1).map((mensagem) => (
                        <p key={mensagem}>{mensagem}</p>
                    ))}
                </Alert>
            )}
            {catalogo.data ? (
                <RegraCampos control={control} catalogo={catalogo.data} vocabularios={vocabularios.data ?? []} />
            ) : (
                <LoadingState rotulo="Carregando catálogo..." />
            )}
        </FormModal>
    );
}

/** Criação de regra (RF002, UC-02 passos 1–6). */
export function NovaRegraModal({ isOpen, aoFechar }: { isOpen: boolean; aoFechar: () => void }) {
    const sessao = useOpenSession(isOpen);
    return isOpen ? <Conteudo key={sessao} aoFechar={aoFechar} /> : null;
}
