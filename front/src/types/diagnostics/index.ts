import type { DimensaoQualidade } from "@/types/rules/regra";

/** Espelha DiagnosticoDto e IndicadorDto do backend (diagnostics/diagnostico.tipos.ts). */
export type SituacaoIndicador = "AVALIADA" | "NAO_AVALIADA";

export interface Indicador {
    dimensao: DimensaoQualidade;
    situacao: SituacaoIndicador;
    percentual: number | null;
    numerador: number | null;
    denominador: number | null;
    linhasComViolacao: number | null;
    regras: { regraId: string; revisao: number; nome: string; colunas: string[] }[];
}

export interface Diagnostico {
    dataset: { id: string; nome: string; situacao: string };
    versao: { id: string; numero: number; hashSha256: string };
    simulacaoId: string;
    conjunto: { id: string; nome: string; revisao: number };
    avaliadoEm: string;
    totalLinhas: number;
    cobertura: { dimensoesAvaliadas: number; totalDimensoes: 3; situacao: "COMPLETA" | "PARCIAL" };
    indicadores: [Indicador, Indicador, Indicador];
    aviso: string;
}

export interface VersaoAvaliavel {
    datasetId: string;
    datasetNome: string;
    versaoId: string;
    numero: number;
    criadoEm: string;
    possuiAvaliacao: boolean;
}

export type FormatoExportacao = "PDF" | "XLSX";
