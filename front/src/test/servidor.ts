import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import type { Operacao, Sessao } from "@/types/auth";

/** Base usada pelo cliente nos testes (NEXT_PUBLIC_API_URL ausente → "/api" relativo ao jsdom). */
export const API = "http://localhost:3000/api";

export const TODAS_OPERACOES: Operacao[] = [
    "SESSAO_PROPRIA",
    "DATASET_IMPORTAR",
    "DATASET_LISTAR",
    "DATASET_CONSULTAR",
    "DATASET_EDITAR_METADADOS",
    "DATASET_NOVA_VERSAO",
    "DATASET_EXCLUIR",
    "REGRA_CONSULTAR",
    "REGRA_MANTER",
    "CONJUNTO_CONSULTAR",
    "CONJUNTO_MANTER",
    "CONJUNTO_ASSOCIAR",
    "VOCABULARIO_CONSULTAR",
    "SIMULACAO_EXECUTAR",
    "SIMULACAO_CONSULTAR",
    "TRATAMENTO_APLICAR",
    "DIAGNOSTICO_CONSULTAR",
    "DIAGNOSTICO_EXPORTAR",
    "AUDITORIA_CONSULTAR",
    "AUDITORIA_EXPORTAR",
];

export const sessaoAnalista: Sessao = {
    usuario: { id: "u-analista", nome: "Ana Analista", email: "analista@teste.local", papel: "ANALISTA" },
    permissoes: TODAS_OPERACOES,
    csrfToken: "csrf-teste",
};

export const sessaoGestor: Sessao = {
    usuario: { id: "u-gestor", nome: "Gil Gestor", email: "gestor@teste.local", papel: "GESTOR" },
    permissoes: ["SESSAO_PROPRIA", "DIAGNOSTICO_CONSULTAR", "DIAGNOSTICO_EXPORTAR", "AUDITORIA_CONSULTAR", "AUDITORIA_EXPORTAR"],
    csrfToken: "csrf-gestor",
};

export function erroApi(status: number, erro: string, mensagem: string, detalhes?: unknown) {
    return HttpResponse.json({ statusCode: status, erro, mensagem, detalhes }, { status });
}

export const servidor = setupServer(http.get(`${API}/auth/sessao`, () => HttpResponse.json(sessaoAnalista)));
