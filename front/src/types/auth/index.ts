/** Perfis (P1, seção 8.3; P2, MOD-10 PapelUsuario). */
export type PapelUsuario = "ANALISTA" | "GESTOR" | "EQUIPE_TECNICA";

/** Operações da matriz perfil × operação do backend (auth/matriz-permissoes.ts). */
export type Operacao =
    | "SESSAO_PROPRIA"
    | "DATASET_IMPORTAR"
    | "DATASET_LISTAR"
    | "DATASET_CONSULTAR"
    | "DATASET_EDITAR_METADADOS"
    | "DATASET_NOVA_VERSAO"
    | "DATASET_EXCLUIR"
    | "REGRA_CONSULTAR"
    | "REGRA_MANTER"
    | "CONJUNTO_CONSULTAR"
    | "CONJUNTO_MANTER"
    | "CONJUNTO_ASSOCIAR"
    | "VOCABULARIO_CONSULTAR"
    | "SIMULACAO_EXECUTAR"
    | "SIMULACAO_CONSULTAR"
    | "TRATAMENTO_APLICAR"
    | "DIAGNOSTICO_CONSULTAR"
    | "DIAGNOSTICO_EXPORTAR"
    | "AUDITORIA_CONSULTAR"
    | "AUDITORIA_EXPORTAR";

export interface Usuario {
    id: string;
    nome: string;
    email: string;
    papel: PapelUsuario;
}

/** Resposta de POST /auth/entrar e GET /auth/sessao. */
export interface Sessao {
    usuario: Usuario;
    permissoes: Operacao[];
    csrfToken: string;
}

export const ROTULO_PAPEL: Record<PapelUsuario, string> = {
    ANALISTA: "Analista de dados em saúde",
    GESTOR: "Gestor em saúde",
    EQUIPE_TECNICA: "Equipe técnica",
};
