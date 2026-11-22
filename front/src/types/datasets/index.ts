/** Espelha DatasetDto, VersaoDto e PaginaRegistrosDto do backend (datasets/dataset.tipos.ts). */
export type SituacaoDataset = "ATIVO" | "EXCLUIDO_LOGICAMENTE";
export type OrigemVersao = "IMPORTACAO" | "TRATAMENTO";
export type SeparadorCsv = "VIRGULA" | "PONTO_E_VIRGULA";

export interface Versao {
    id: string;
    datasetId: string;
    numero: number;
    versaoPredecessoraId: string | null;
    origem: OrigemVersao;
    hashSha256: string;
    tamanhoBytes: number;
    separador: "," | ";";
    colunas: string[];
    totalRegistros: number;
    totalColunas: number;
    nomeArquivoOriginal: string | null;
    criadoPor: string;
    criadoEm: string;
}

export interface Dataset {
    id: string;
    nome: string;
    descricao: string;
    situacao: SituacaoDataset;
    criadoPor: string;
    criadoEm: string;
    atualizadoEm: string;
    excluidoEm: string | null;
    versaoAtual: Versao | null;
    totalVersoes: number;
}

export interface DatasetDetalhe extends Dataset {
    versoes: Versao[];
}

export interface RegistroVersao {
    linha: number;
    valores: Record<string, string>;
}

export interface PaginaRegistrosResposta {
    versaoId: string;
    colunas: string[];
    pagina: number;
    tamanho: number;
    totalRegistros: number;
    registros: RegistroVersao[];
}

export interface ImportarDatasetPayload {
    arquivo: File;
    nome: string;
    descricao?: string;
    separador: SeparadorCsv;
}

/** Limites inclusivos do contrato de importação (P1, seção 8.3). */
export const LIMITE_BYTES = 10_000_000;

export const ROTULO_SEPARADOR: Record<SeparadorCsv, string> = { VIRGULA: "Vírgula (,)", PONTO_E_VIRGULA: "Ponto e vírgula (;)" };
