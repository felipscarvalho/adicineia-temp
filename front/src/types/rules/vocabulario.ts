/** Espelha VocabularioDto do backend (rules/vocabularios/vocabulario.tipos.ts). */
export interface Vocabulario {
    id: string;
    nome: string;
    origem: string;
    versao: string;
    licenca: string;
    hashArquivo: string;
    totalCodigos: number;
    importadoEm: string;
}
