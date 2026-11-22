import { apiGet } from "@/lib/api";
import type { Vocabulario } from "@/types/rules/vocabulario";

/** GET /vocabularios: somente vocabulários admitidos e identificados por origem, versão e licença. */
export function listarVocabularios(): Promise<Vocabulario[]> {
    return apiGet<Vocabulario[]>("/vocabularios");
}
