import type { Dataset } from "@/types/datasets";
import type { Catalogo, Conjunto, Regra } from "@/types/rules/regra";
import type { Vocabulario } from "@/types/rules/vocabulario";

/** Dados de exemplo compartilhados pelos testes (sintéticos). */
export const datasetExemplo: Dataset = {
    id: "d1",
    nome: "Atendimentos 2025",
    descricao: "Base sintética",
    situacao: "ATIVO",
    criadoPor: "u-analista",
    criadoEm: "2026-11-20T10:00:00.000Z",
    atualizadoEm: "2026-11-21T10:00:00.000Z",
    excluidoEm: null,
    totalVersoes: 2,
    versaoAtual: {
        id: "v2",
        datasetId: "d1",
        numero: 2,
        versaoPredecessoraId: "v1",
        origem: "IMPORTACAO",
        hashSha256: "a".repeat(64),
        tamanhoBytes: 1200,
        separador: ";",
        colunas: ["id", "sexo"],
        totalRegistros: 24,
        totalColunas: 2,
        nomeArquivoOriginal: "atendimentos.csv",
        criadoPor: "u-analista",
        criadoEm: "2026-11-21T10:00:00.000Z",
    },
};

export const vocabularioCid10: Vocabulario = {
    id: "voc-cid10",
    nome: "CID-10",
    origem: "Amostra sintética de teste (não oficial)",
    versao: "amostra-teste-1",
    licenca: "Uso restrito aos testes acadêmicos",
    hashArquivo: "c".repeat(64),
    totalCodigos: 25,
    importadoEm: "2026-11-20T08:00:00.000Z",
};

/** Mesmo catálogo publicado pelo backend em GET /catalogo. */
export const catalogo: Catalogo = {
    dimensoes: ["UNICIDADE", "COMPLETUDE", "VALIDADE"],
    tiposColuna: ["TEXTO", "DECIMAL", "DATA"],
    combinadores: ["E", "OU"],
    limiteCondicoes: 5,
    operadores: [
        { codigo: "IGUAL", rotulo: "igual a", tipos: ["TEXTO", "DECIMAL", "DATA"], parametro: "CONSTANTE" },
        { codigo: "DIFERENTE", rotulo: "diferente de", tipos: ["TEXTO", "DECIMAL", "DATA"], parametro: "CONSTANTE" },
        { codigo: "VAZIO", rotulo: "está vazio", tipos: ["TEXTO", "DECIMAL", "DATA"], parametro: "NENHUM" },
        { codigo: "NAO_VAZIO", rotulo: "não está vazio", tipos: ["TEXTO", "DECIMAL", "DATA"], parametro: "NENHUM" },
        { codigo: "PERTENCE_LISTA", rotulo: "pertence à lista", tipos: ["TEXTO"], parametro: "LISTA" },
        { codigo: "PERTENCE_VOCABULARIO", rotulo: "pertence ao vocabulário oficial", tipos: ["TEXTO"], parametro: "VOCABULARIO" },
        { codigo: "MAIOR", rotulo: "maior que", tipos: ["DECIMAL", "DATA"], parametro: "CONSTANTE" },
        { codigo: "MAIOR_IGUAL", rotulo: "maior ou igual a", tipos: ["DECIMAL", "DATA"], parametro: "CONSTANTE" },
        { codigo: "MENOR", rotulo: "menor que", tipos: ["DECIMAL", "DATA"], parametro: "CONSTANTE" },
        { codigo: "MENOR_IGUAL", rotulo: "menor ou igual a", tipos: ["DECIMAL", "DATA"], parametro: "CONSTANTE" },
    ],
    acoes: [
        { tipo: "APARAR_ESPACOS", rotulo: "Aparar espaços nas extremidades", dimensoes: ["COMPLETUDE", "VALIDADE"], tiposColuna: ["TEXTO"] },
        { tipo: "CONVERTER_CAIXA", rotulo: "Converter para maiúsculas ou minúsculas", dimensoes: ["COMPLETUDE", "VALIDADE"], tiposColuna: ["TEXTO"] },
        {
            tipo: "PREENCHER_VAZIO",
            rotulo: "Preencher campo vazio com literal",
            dimensoes: ["COMPLETUDE", "VALIDADE"],
            tiposColuna: ["TEXTO", "DECIMAL", "DATA"],
        },
        { tipo: "REMOVER_REPETICOES", rotulo: "Remover repetições mantendo a primeira ocorrência", dimensoes: ["UNICIDADE"], tiposColuna: [] },
    ],
};

export const regraIdade: Regra = {
    id: "r-idade",
    nome: "Idade entre 0 e 120",
    descricao: "",
    dimensao: "VALIDADE",
    revisao: 2,
    situacao: "ATIVO",
    configuracao: {
        dimensao: "VALIDADE",
        combinador: "E",
        condicoes: [
            { coluna: "idade", tipo: "DECIMAL", operador: "MAIOR_IGUAL", valor: "0" },
            { coluna: "idade", tipo: "DECIMAL", operador: "MENOR_IGUAL", valor: "120" },
        ],
    },
    criadoEm: "2026-11-20T10:00:00.000Z",
    atualizadoEm: "2026-11-21T10:00:00.000Z",
};

export const regraSexo: Regra = {
    id: "r-sexo",
    nome: "Sexo informado",
    descricao: "",
    dimensao: "COMPLETUDE",
    revisao: 1,
    situacao: "ATIVO",
    configuracao: {
        dimensao: "COMPLETUDE",
        colunas: [{ nome: "sexo", tipo: "TEXTO" }],
        marcadoresAusencia: ["ignorado"],
        acao: { tipo: "PREENCHER_VAZIO", coluna: "sexo", valor: "NAO_INFORMADO" },
    },
    criadoEm: "2026-11-20T10:00:00.000Z",
    atualizadoEm: "2026-11-20T10:00:00.000Z",
};

export const conjuntoExemplo: Conjunto = {
    id: "c1",
    nome: "Conjunto atendimentos",
    descricao: "",
    revisao: 3,
    situacao: "ATIVO",
    regras: [
        { ordem: 1, regraId: "r-sexo", revisao: 1, nome: "Sexo informado", dimensao: "COMPLETUDE", configuracao: regraSexo.configuracao },
        { ordem: 2, regraId: "r-idade", revisao: 2, nome: "Idade entre 0 e 120", dimensao: "VALIDADE", configuracao: regraIdade.configuracao },
    ],
    datasets: ["d1"],
    criadoEm: "2026-11-20T10:00:00.000Z",
    atualizadoEm: "2026-11-21T10:00:00.000Z",
};
