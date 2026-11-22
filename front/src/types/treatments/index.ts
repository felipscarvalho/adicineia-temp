import type { Versao } from "@/types/datasets";

/** Espelha ResultadoTratamento do backend (treatments/tratamento.service.ts). */
export interface ResultadoTratamento {
    simulacaoId: string;
    extratoId: string;
    instanteUtc: string;
    versaoEntrada: { id: string; numero: number; hashSha256: string };
    versaoSaida: Versao;
    totalLinhasAlteradas: number;
    totalLinhasRemovidas: number;
    totalLinhasAfetadas: number;
}
