/** Espelha os tipos do catálogo do backend (rules/motor/tipos.ts e rules/regras.tipos.ts). */
export type DimensaoQualidade = "UNICIDADE" | "COMPLETUDE" | "VALIDADE";
export type TipoColuna = "TEXTO" | "DECIMAL" | "DATA";
export type Combinador = "E" | "OU";
export type TipoAcao = "APARAR_ESPACOS" | "CONVERTER_CAIXA" | "PREENCHER_VAZIO" | "REMOVER_REPETICOES";
export type Caixa = "MAIUSCULAS" | "MINUSCULAS";
export type SituacaoCadastro = "ATIVO" | "EXCLUIDO_LOGICAMENTE";

export interface ColunaTipada {
    nome: string;
    tipo: TipoColuna;
}

export interface Condicao {
    coluna: string;
    tipo: TipoColuna;
    operador: string;
    valor?: string;
    valores?: string[];
    vocabularioId?: string;
}

export interface ConfiguracaoAcao {
    tipo: TipoAcao;
    coluna?: string;
    caixa?: Caixa;
    valor?: string;
}

export type ConfiguracaoRegra =
    | { dimensao: "UNICIDADE"; colunas: ColunaTipada[]; acao?: ConfiguracaoAcao }
    | { dimensao: "COMPLETUDE"; colunas: ColunaTipada[]; marcadoresAusencia?: string[]; acao?: ConfiguracaoAcao }
    | { dimensao: "VALIDADE"; combinador: Combinador; condicoes: Condicao[]; acao?: ConfiguracaoAcao };

export interface Regra {
    id: string;
    nome: string;
    descricao: string;
    dimensao: DimensaoQualidade;
    revisao: number;
    situacao: SituacaoCadastro;
    configuracao: ConfiguracaoRegra;
    criadoEm: string;
    atualizadoEm: string;
}

export interface RevisaoRegra {
    revisao: number;
    nome: string;
    descricao: string;
    dimensao: DimensaoQualidade;
    configuracao: ConfiguracaoRegra;
    criadoPor: string;
    criadoEm: string;
}

export interface RegraNoConjunto {
    ordem: number;
    regraId: string;
    revisao: number;
    nome: string;
    dimensao: DimensaoQualidade;
    configuracao: ConfiguracaoRegra;
}

export interface Conjunto {
    id: string;
    nome: string;
    descricao: string;
    revisao: number;
    situacao: SituacaoCadastro;
    regras: RegraNoConjunto[];
    datasets: string[];
    criadoEm: string;
    atualizadoEm: string;
}

export interface RevisaoConjunto {
    revisao: number;
    nome: string;
    descricao: string;
    itens: { regraId: string; regraRevisao: number; ordem: number }[];
    motivo: "CRIACAO" | "EDICAO_CONJUNTO" | "REVISAO_REGRA";
    criadoPor: string;
    criadoEm: string;
}

export interface OperadorCatalogo {
    codigo: string;
    rotulo: string;
    tipos: TipoColuna[];
    parametro: "NENHUM" | "CONSTANTE" | "LISTA" | "VOCABULARIO";
}

export interface AcaoCatalogo {
    tipo: TipoAcao;
    rotulo: string;
    dimensoes: DimensaoQualidade[];
    tiposColuna: TipoColuna[];
}

/** GET /catalogo: catálogo fechado publicado pelo backend (ADR-002). */
export interface Catalogo {
    dimensoes: DimensaoQualidade[];
    tiposColuna: TipoColuna[];
    combinadores: Combinador[];
    limiteCondicoes: number;
    operadores: OperadorCatalogo[];
    acoes: AcaoCatalogo[];
}

export const ROTULO_DIMENSAO: Record<DimensaoQualidade, string> = { UNICIDADE: "Unicidade", COMPLETUDE: "Completude", VALIDADE: "Validade" };
export const ROTULO_TIPO: Record<TipoColuna, string> = { TEXTO: "Texto", DECIMAL: "Número decimal", DATA: "Data (AAAA-MM-DD)" };
export const ROTULO_ACAO: Record<TipoAcao, string> = {
    APARAR_ESPACOS: "Aparar espaços",
    CONVERTER_CAIXA: "Converter caixa",
    PREENCHER_VAZIO: "Preencher vazio",
    REMOVER_REPETICOES: "Remover repetições",
};
