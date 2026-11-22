import { BarChartSquare02, ClipboardCheck, Database01, FileSearch02, Grid01, List, PlayCircle } from "@untitledui/icons";
import type { Operacao } from "@/types/auth";
import type { SecaoNavegacao } from "./sidebar";

/**
 * Navegação da área logada, dividida por módulo (telas T01–T07 da P2). Cada item exige a operação
 * da matriz do backend; tela nova entra na seção do seu módulo.
 */
export const NAVEGACAO: SecaoNavegacao[] = [
    { rotulo: "Dados", itens: [{ rotulo: "Datasets", href: "/datasets", icone: Database01, operacao: "DATASET_LISTAR" }] },
    {
        rotulo: "Regras",
        itens: [
            { rotulo: "Regras", href: "/regras", icone: List, operacao: "REGRA_CONSULTAR" },
            { rotulo: "Conjuntos", href: "/conjuntos", icone: Grid01, operacao: "CONJUNTO_CONSULTAR" },
            { rotulo: "Vocabulários", href: "/vocabularios", icone: FileSearch02, operacao: "VOCABULARIO_CONSULTAR" },
        ],
    },
    {
        rotulo: "Avaliação",
        itens: [
            { rotulo: "Simulações", href: "/simulacoes", icone: PlayCircle, operacao: "SIMULACAO_CONSULTAR" },
            { rotulo: "Diagnóstico", href: "/diagnosticos", icone: BarChartSquare02, operacao: "DIAGNOSTICO_CONSULTAR" },
        ],
    },
    { rotulo: "Rastreabilidade", itens: [{ rotulo: "Auditoria", href: "/auditoria", icone: ClipboardCheck, operacao: "AUDITORIA_CONSULTAR" }] },
];

export function filtrarNavegacao(secoes: SecaoNavegacao[], permissoes: Operacao[]): SecaoNavegacao[] {
    return secoes
        .map((secao) => ({ ...secao, itens: secao.itens.filter((item) => permissoes.includes(item.operacao)) }))
        .filter((secao) => secao.itens.length > 0);
}

/** Primeira tela disponível para o perfil (destino após a entrada). */
export function telaInicial(permissoes: Operacao[]): string {
    return filtrarNavegacao(NAVEGACAO, permissoes)[0]?.itens[0]?.href ?? "/login";
}
