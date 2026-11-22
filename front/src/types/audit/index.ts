import type { TipoAcao } from "@/types/rules/regra";

/** Espelha ExtratoDto e AlteracaoDto do backend (audit/auditoria.tipos.ts). */
export interface Extrato {
    id: string;
    operacao: string;
    simulacaoId: string;
    dataset: { id: string; nome: string; situacao: string };
    usuarioId: string;
    instanteUtc: string;
    versaoEntrada: { id: string; numero: number; hashSha256: string };
    versaoSaida: { id: string; numero: number; hashSha256: string };
    conjunto: { id: string; revisao: number };
    revisoesRegras: { regraId: string; revisao: number; nome: string; ordem: number }[];
    acoesAplicadas: { ordem: number; regraId: string; acao: TipoAcao; coluna: string | null }[];
    totalLinhasAlteradas: number;
    totalLinhasRemovidas: number;
    totalLinhasAfetadas: number;
    totalAlteracoes: number;
}

export interface Alteracao {
    linha: number;
    tipo: "ATUALIZACAO" | "REMOCAO";
    regraId: string;
    regraRevisao: number;
    acao: TipoAcao;
    coluna: string | null;
    valorAnterior: string | null;
    valorNovo: string | null;
    linhaRepresentante: number | null;
}

export interface ExtratoDetalhe extends Extrato {
    alteracoes: { pagina: number; tamanho: number; total: number; itens: Alteracao[] };
}

export interface DatasetAuditado {
    id: string;
    nome: string;
    situacao: string;
    totalExtratos: number;
    ultimaIntervencao: string;
}
