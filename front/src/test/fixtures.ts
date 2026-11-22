import type { Dataset } from "@/types/datasets";
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
