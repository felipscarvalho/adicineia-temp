import type { ConfiguracaoRegra, DimensaoQualidade, TipoAcao } from "@/types/rules/regra";

/** Espelha SimulacaoDto do backend (simulations/simulacao.tipos.ts). */
export type StatusSimulacao = "EM_EXECUCAO" | "CONCLUIDA" | "TEMPO_ESGOTADO" | "FALHA" | "INVALIDADA" | "CONSOLIDADA";

export interface ResultadoRegra {
    ordem: number;
    regraId: string;
    revisao: number;
    nome: string;
    dimensao: DimensaoQualidade;
    colunas: string[];
    totalAvaliados: number;
    totalViolacoes: number;
    linhasVioladas: number[];
    percentualAprovacao: number;
    acao: TipoAcao | null;
    linhasPrevistas: number;
}

export interface LinhaPrevia {
    linha: number;
    tipo: "ATUALIZACAO" | "REMOCAO";
    antes: Record<string, string>;
    depois: Record<string, string> | null;
    acoes: { regraId: string; acao: TipoAcao; coluna: string | null }[];
}

export interface Simulacao {
    id: string;
    status: StatusSimulacao;
    mensagem: string | null;
    datasetId: string;
    versaoId: string;
    versaoNumero: number;
    conjunto: { id: string; nome: string; revisao: number };
    aceitaEm: string;
    concluidaEm: string | null;
    limiteMs: number;
    vigente: boolean;
    motivoNaoVigente: string | null;
    aplicavel: boolean;
    hashEntrada: string;
    hashEntradaConferido: string | null;
    totalLinhas: number | null;
    totalLinhasComViolacao: number | null;
    totalPrevistoAlteradas: number | null;
    totalPrevistoRemovidas: number | null;
    totalPrevistoAfetadas: number | null;
    resultados: ResultadoRegra[];
    previa: LinhaPrevia[];
    configuracaoExecutada: {
        regras: { regraId: string; revisao: number; nome: string; ordem: number; configuracao: ConfiguracaoRegra }[];
        vocabularios: { id: string; nome: string; versao: string }[];
    };
}

export const ROTULO_STATUS: Record<StatusSimulacao, string> = {
    EM_EXECUCAO: "Em execução",
    CONCLUIDA: "Concluída",
    TEMPO_ESGOTADO: "Tempo esgotado",
    FALHA: "Falha",
    INVALIDADA: "Invalidada",
    CONSOLIDADA: "Aplicada",
};
