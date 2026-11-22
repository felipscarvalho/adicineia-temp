import { useQuery } from "@tanstack/react-query";
import * as vocabulariosService from "@/services/rules/vocabularios";

export const vocabularioKeys = {
    all: ["vocabularios"] as const,
    lista: () => [...vocabularioKeys.all, "lista"] as const,
};

export function useVocabularios(habilitado = true) {
    return useQuery({ queryKey: vocabularioKeys.lista(), queryFn: vocabulariosService.listarVocabularios, enabled: habilitado });
}
