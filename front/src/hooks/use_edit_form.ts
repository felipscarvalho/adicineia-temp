import { useEffect } from "react";
import { type DefaultValues, type FieldValues, type Resolver, useForm } from "react-hook-form";

/**
 * Formulário de edição direta das telas de detalhe: carrega os dados salvos, recarrega quando
 * eles mudam no servidor e oferece `discard` para voltar ao que está salvo.
 */
export function useEditForm<T extends FieldValues>(opcoes: { salvos: T | undefined; resolver: Resolver<T> }) {
    const formulario = useForm<T>({ resolver: opcoes.resolver, defaultValues: opcoes.salvos as DefaultValues<T> | undefined });
    const { reset } = formulario;
    const assinatura = JSON.stringify(opcoes.salvos ?? null);

    useEffect(() => {
        if (opcoes.salvos) {
            reset(opcoes.salvos);
        }
        // A assinatura evita recarregar quando o objeto muda de referência sem mudar de conteúdo.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assinatura, reset]);

    return {
        ...formulario,
        alterado: formulario.formState.isDirty,
        discard: () => opcoes.salvos && reset(opcoes.salvos),
    };
}
