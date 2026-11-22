import { type ConfiguracaoRegra, ROTULO_ACAO } from "@/types/rules/regra";

const SIMBOLO: Record<string, string> = {
    IGUAL: "=",
    DIFERENTE: "≠",
    MAIOR: ">",
    MAIOR_IGUAL: "≥",
    MENOR: "<",
    MENOR_IGUAL: "≤",
    VAZIO: "está vazio",
    NAO_VAZIO: "não está vazio",
    PERTENCE_LISTA: "∈",
    PERTENCE_VOCABULARIO: "∈ vocabulário",
};

/** Resumo legível de uma configuração (listas, conjuntos e prévias). */
export function descreverRegra(config: ConfiguracaoRegra): string {
    let texto: string;
    if (config.dimensao === "UNICIDADE") {
        texto = `Chave: ${config.colunas.map((c) => c.nome).join(" + ")}`;
    } else if (config.dimensao === "COMPLETUDE") {
        texto = `Preenchidas: ${config.colunas.map((c) => c.nome).join(", ")}`;
        if (config.marcadoresAusencia?.length) {
            texto += ` (ausência: ${config.marcadoresAusencia.join(", ")})`;
        }
    } else {
        texto = config.condicoes
            .map((c) => {
                const simbolo = SIMBOLO[c.operador] ?? c.operador;
                if (c.operador === "PERTENCE_LISTA") return `${c.coluna} ∈ {${(c.valores ?? []).join(", ")}}`;
                if (c.valor !== undefined) return `${c.coluna} ${simbolo} ${c.valor}`;
                return `${c.coluna} ${simbolo}`;
            })
            .join(` ${config.combinador} `);
    }
    if (config.acao) {
        texto += ` · ação: ${ROTULO_ACAO[config.acao.tipo]}${config.acao.coluna ? ` em ${config.acao.coluna}` : ""}`;
    }
    return texto;
}
