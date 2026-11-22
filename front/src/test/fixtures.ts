import type { ExtratoDetalhe } from "@/types/audit";
import type { Dataset } from "@/types/datasets";
import type { Diagnostico } from "@/types/diagnostics";
import type { Catalogo, Conjunto, Regra } from "@/types/rules/regra";
import type { Vocabulario } from "@/types/rules/vocabulario";
import type { Simulacao } from "@/types/simulations";

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

export const simulacaoConcluida: Simulacao = {
    id: "s1",
    status: "CONCLUIDA",
    mensagem: null,
    datasetId: "d1",
    versaoId: "v2",
    versaoNumero: 2,
    conjunto: { id: "c1", nome: "Conjunto atendimentos", revisao: 3 },
    aceitaEm: "2026-11-21T12:00:00.000Z",
    concluidaEm: "2026-11-21T12:00:01.000Z",
    limiteMs: 60000,
    vigente: true,
    motivoNaoVigente: null,
    aplicavel: true,
    hashEntrada: "a".repeat(64),
    hashEntradaConferido: "a".repeat(64),
    totalLinhas: 24,
    totalLinhasComViolacao: 5,
    totalPrevistoAlteradas: 2,
    totalPrevistoRemovidas: 1,
    totalPrevistoAfetadas: 3,
    resultados: [
        {
            ordem: 1,
            regraId: "r-sexo",
            revisao: 1,
            nome: "Sexo informado",
            dimensao: "COMPLETUDE",
            colunas: ["sexo"],
            totalAvaliados: 24,
            totalViolacoes: 3,
            linhasVioladas: [3, 8, 14],
            percentualAprovacao: 87.5,
            acao: "PREENCHER_VAZIO",
            linhasPrevistas: 2,
        },
        {
            ordem: 2,
            regraId: "r-idade",
            revisao: 2,
            nome: "Idade entre 0 e 120",
            dimensao: "VALIDADE",
            colunas: ["idade"],
            totalAvaliados: 24,
            totalViolacoes: 3,
            linhasVioladas: [4, 9, 11],
            percentualAprovacao: 87.5,
            acao: null,
            linhasPrevistas: 0,
        },
    ],
    previa: [
        {
            linha: 3,
            tipo: "ATUALIZACAO",
            antes: { sexo: "" },
            depois: { sexo: "NAO_INFORMADO" },
            acoes: [{ regraId: "r-sexo", acao: "PREENCHER_VAZIO", coluna: "sexo" }],
        },
        { linha: 6, tipo: "REMOCAO", antes: { id: "A002" }, depois: null, acoes: [{ regraId: "r-id", acao: "REMOVER_REPETICOES", coluna: null }] },
    ],
    configuracaoExecutada: {
        regras: [
            { regraId: "r-sexo", revisao: 1, nome: "Sexo informado", ordem: 1, configuracao: regraSexo.configuracao },
            { regraId: "r-idade", revisao: 2, nome: "Idade entre 0 e 120", ordem: 2, configuracao: regraIdade.configuracao },
        ],
        vocabularios: [],
    },
};

export const simulacaoEmExecucao: Simulacao = {
    ...simulacaoConcluida,
    status: "EM_EXECUCAO",
    concluidaEm: null,
    aplicavel: false,
    hashEntradaConferido: null,
    totalLinhas: null,
    totalLinhasComViolacao: null,
    totalPrevistoAlteradas: null,
    totalPrevistoRemovidas: null,
    totalPrevistoAfetadas: null,
    resultados: [],
    previa: [],
};

export const extratoExemplo: ExtratoDetalhe = {
    id: "e1",
    operacao: "TRATAMENTO",
    simulacaoId: "s1",
    dataset: { id: "d1", nome: "Atendimentos 2025", situacao: "EXCLUIDO_LOGICAMENTE" },
    usuarioId: "u-analista",
    instanteUtc: "2026-11-21T12:05:00.000Z",
    versaoEntrada: { id: "v1", numero: 1, hashSha256: "a".repeat(64) },
    versaoSaida: { id: "v2", numero: 2, hashSha256: "b".repeat(64) },
    conjunto: { id: "c1", revisao: 3 },
    revisoesRegras: [{ regraId: "r-sexo", revisao: 1, nome: "Sexo informado", ordem: 1 }],
    acoesAplicadas: [{ ordem: 1, regraId: "r-sexo", acao: "PREENCHER_VAZIO", coluna: "sexo" }],
    totalLinhasAlteradas: 2,
    totalLinhasRemovidas: 1,
    totalLinhasAfetadas: 3,
    totalAlteracoes: 3,
    alteracoes: {
        pagina: 1,
        tamanho: 50,
        total: 3,
        itens: [
            {
                linha: 3,
                tipo: "ATUALIZACAO",
                regraId: "r-sexo",
                regraRevisao: 1,
                acao: "PREENCHER_VAZIO",
                coluna: "sexo",
                valorAnterior: "",
                valorNovo: "NAO_INFORMADO",
                linhaRepresentante: null,
            },
            {
                linha: 6,
                tipo: "REMOCAO",
                regraId: "r-id",
                regraRevisao: 1,
                acao: "REMOVER_REPETICOES",
                coluna: null,
                valorAnterior: null,
                valorNovo: null,
                linhaRepresentante: 2,
            },
            {
                linha: 14,
                tipo: "ATUALIZACAO",
                regraId: "r-sexo",
                regraRevisao: 1,
                acao: "PREENCHER_VAZIO",
                coluna: "sexo",
                valorAnterior: "   ",
                valorNovo: "NAO_INFORMADO",
                linhaRepresentante: null,
            },
        ],
    },
};

export const diagnosticoParcial: Diagnostico = {
    dataset: { id: "d1", nome: "Internações", situacao: "ATIVO" },
    versao: { id: "v1", numero: 1, hashSha256: "d".repeat(64) },
    simulacaoId: "s9",
    conjunto: { id: "c9", nome: "Conjunto internações", revisao: 1 },
    avaliadoEm: "2026-11-21T13:00:00.000Z",
    totalLinhas: 21,
    cobertura: { dimensoesAvaliadas: 2, totalDimensoes: 3, situacao: "PARCIAL" },
    indicadores: [
        { dimensao: "UNICIDADE", situacao: "NAO_AVALIADA", percentual: null, numerador: null, denominador: null, linhasComViolacao: null, regras: [] },
        {
            dimensao: "COMPLETUDE",
            situacao: "AVALIADA",
            percentual: 85.71,
            numerador: 18,
            denominador: 21,
            linhasComViolacao: 3,
            regras: [{ regraId: "r1", revisao: 1, nome: "Diagnóstico informado", colunas: ["diagnostico"] }],
        },
        {
            dimensao: "VALIDADE",
            situacao: "AVALIADA",
            percentual: 57.14,
            numerador: 12,
            denominador: 21,
            linhasComViolacao: 9,
            regras: [{ regraId: "r2", revisao: 1, nome: "Valor positivo", colunas: ["valor_total"] }],
        },
    ],
    aviso: "Os indicadores descrevem somente as regras executadas nesta avaliação e não constituem certificação, atestado ou garantia de confiabilidade clínica dos dados.",
};
