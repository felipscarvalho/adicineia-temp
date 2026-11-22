import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/lib/api";

/**
 * Leva para os campos os erros apontados pelo backend (`detalhes[{ campo, mensagem }]`). Devolve as
 * mensagens que não correspondem a um campo do formulário, para exibição em alerta.
 */
export function aplicarErrosServidor<T extends FieldValues>(erro: ApiError, setError: UseFormSetError<T>, mapear: (campo: string) => string | null): string[] {
    const restantes: string[] = [];
    for (const { campo, mensagem } of erro.errosDeCampo) {
        const caminho = mapear(campo);
        if (caminho) {
            setError(caminho as Path<T>, { type: "server", message: mensagem });
        } else {
            restantes.push(`${campo}: ${mensagem}`);
        }
    }
    return restantes;
}
