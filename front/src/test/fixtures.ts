import type { Dataset } from "@/types/datasets";

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
