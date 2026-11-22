import { z } from "zod";
import type { Caixa, ConfiguracaoAcao, ConfiguracaoRegra, TipoAcao, TipoColuna } from "@/types/rules/regra";

/** Limites do catálogo (P1, seção 8.3); o backend revalida tudo. */
export const LIMITE_CONDICOES = 5;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

const tipoColuna = z.enum(["TEXTO", "DECIMAL", "DATA"]);

/** Campos de coluna e condição são exigidos só na dimensão em uso (os da outra ficam ocultos). */
const colunaSchema = z.object({ nome: z.string(), tipo: tipoColuna });

const condicaoSchema = z.object({
    coluna: z.string(),
    tipo: tipoColuna,
    operador: z.string(),
    valor: z.string(),
    /** Lista literal, um valor por linha. */
    valores: z.string(),
    vocabularioId: z.string(),
});

export const regraFormSchema = z
    .object({
        nome: z.string().trim().min(1, "Informe o nome da regra.").max(200, "Use no máximo 200 caracteres."),
        descricao: z.string().max(2000, "Use no máximo 2.000 caracteres."),
        dimensao: z.enum(["UNICIDADE", "COMPLETUDE", "VALIDADE"], { message: "Escolha a dimensão." }),
        colunas: z.array(colunaSchema),
        /** Marcadores de ausência, separados por vírgula (ex.: ignorado, IGN). */
        marcadores: z.string(),
        combinador: z.enum(["E", "OU"]),
        condicoes: z.array(condicaoSchema),
        /** SEM_ACAO: regra apenas avaliativa, que não altera dados. */
        acaoTipo: z.enum(["SEM_ACAO", "APARAR_ESPACOS", "CONVERTER_CAIXA", "PREENCHER_VAZIO", "REMOVER_REPETICOES"]),
        acaoColuna: z.string(),
        acaoCaixa: z.union([z.enum(["MAIUSCULAS", "MINUSCULAS"]), z.literal("")]),
        acaoValor: z.string(),
    })
    .superRefine((regra, ctx) => {
        const erro = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
        if (regra.dimensao === "VALIDADE") {
            if (regra.condicoes.length === 0) {
                erro(["condicoes"], "Adicione ao menos uma condição.");
            }
            if (regra.condicoes.length > LIMITE_CONDICOES) {
                erro(["condicoes"], `Cada regra admite no máximo ${LIMITE_CONDICOES} condições.`);
            }
            regra.condicoes.forEach((condicao, i) => {
                if (!condicao.coluna.trim()) {
                    erro(["condicoes", i, "coluna"], "Informe a coluna.");
                }
                if (!condicao.operador) {
                    erro(["condicoes", i, "operador"], "Escolha o operador.");
                }
                if (condicao.operador === "PERTENCE_LISTA" && listaDeValores(condicao.valores).length === 0) {
                    erro(["condicoes", i, "valores"], "Informe ao menos um valor da lista.");
                }
                if (condicao.operador === "PERTENCE_VOCABULARIO" && !condicao.vocabularioId) {
                    erro(["condicoes", i, "vocabularioId"], "Selecione o vocabulário oficial e a versão.");
                }
                if (OPERADORES_COM_CONSTANTE.has(condicao.operador)) {
                    if (!condicao.valor.trim()) {
                        erro(["condicoes", i, "valor"], "Informe o valor de comparação.");
                    } else if (condicao.tipo === "DECIMAL" && !DECIMAL.test(condicao.valor.trim())) {
                        erro(["condicoes", i, "valor"], "Use ponto como separador decimal, sem milhares (ex.: 10.5).");
                    } else if (condicao.tipo === "DATA" && !DATA.test(condicao.valor.trim())) {
                        erro(["condicoes", i, "valor"], "Use o formato AAAA-MM-DD.");
                    }
                }
            });
        } else {
            if (regra.colunas.length === 0) {
                erro(["colunas"], "Adicione ao menos uma coluna.");
            }
            regra.colunas.forEach((coluna, i) => {
                if (!coluna.nome.trim()) {
                    erro(["colunas", i, "nome"], "Informe a coluna.");
                }
            });
            if (regra.dimensao === "COMPLETUDE" && regra.colunas.length > LIMITE_CONDICOES) {
                erro(["colunas"], `Selecione no máximo ${LIMITE_CONDICOES} colunas.`);
            }
        }
        if (regra.acaoTipo !== "SEM_ACAO" && regra.acaoTipo !== "REMOVER_REPETICOES" && !regra.acaoColuna) {
            erro(["acaoColuna"], "Escolha a coluna da ação.");
        }
        if (regra.acaoTipo === "CONVERTER_CAIXA" && !regra.acaoCaixa) {
            erro(["acaoCaixa"], "Escolha maiúsculas ou minúsculas.");
        }
        if (regra.acaoTipo === "PREENCHER_VAZIO" && !regra.acaoValor.trim()) {
            erro(["acaoValor"], "Informe o valor literal de preenchimento.");
        }
    });

export type RegraForm = z.infer<typeof regraFormSchema>;

export const OPERADORES_COM_CONSTANTE = new Set(["IGUAL", "DIFERENTE", "MAIOR", "MAIOR_IGUAL", "MENOR", "MENOR_IGUAL"]);

export function listaDeValores(texto: string): string[] {
    return texto
        .split("\n")
        .map((valor) => valor.trim())
        .filter(Boolean);
}

export const regraFormVazio: RegraForm = {
    nome: "",
    descricao: "",
    dimensao: "COMPLETUDE",
    colunas: [{ nome: "", tipo: "TEXTO" }],
    marcadores: "",
    combinador: "E",
    condicoes: [],
    acaoTipo: "SEM_ACAO",
    acaoColuna: "",
    acaoCaixa: "",
    acaoValor: "",
};

/** Converte o formulário na configuração JSON do catálogo (ADR-002). */
export function paraConfiguracao(form: RegraForm): ConfiguracaoRegra {
    let acao: ConfiguracaoAcao | undefined;
    if (form.acaoTipo !== "SEM_ACAO") {
        acao = { tipo: form.acaoTipo as TipoAcao };
        if (form.acaoTipo !== "REMOVER_REPETICOES") {
            acao.coluna = form.acaoColuna;
        }
        if (form.acaoTipo === "CONVERTER_CAIXA") {
            acao.caixa = form.acaoCaixa as Caixa;
        }
        if (form.acaoTipo === "PREENCHER_VAZIO") {
            acao.valor = form.acaoValor.trim();
        }
    }
    const comAcao = <T extends object>(config: T) => (acao ? { ...config, acao } : config);
    if (form.dimensao === "VALIDADE") {
        return comAcao({
            dimensao: "VALIDADE" as const,
            combinador: form.combinador,
            condicoes: form.condicoes.map((c) => {
                const base = { coluna: c.coluna.trim(), tipo: c.tipo as TipoColuna, operador: c.operador };
                if (c.operador === "PERTENCE_LISTA") return { ...base, valores: listaDeValores(c.valores) };
                if (c.operador === "PERTENCE_VOCABULARIO") return { ...base, vocabularioId: c.vocabularioId };
                if (OPERADORES_COM_CONSTANTE.has(c.operador)) return { ...base, valor: c.valor.trim() };
                return base;
            }),
        });
    }
    const colunas = form.colunas.map((c) => ({ nome: c.nome.trim(), tipo: c.tipo as TipoColuna }));
    if (form.dimensao === "UNICIDADE") {
        return comAcao({ dimensao: "UNICIDADE" as const, colunas });
    }
    const marcadores = form.marcadores
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
    return comAcao({ dimensao: "COMPLETUDE" as const, colunas, ...(marcadores.length ? { marcadoresAusencia: marcadores } : {}) });
}

/** Converte a configuração salva no formulário (edição direta da regra). */
export function paraFormulario(regra: { nome: string; descricao: string; configuracao: ConfiguracaoRegra }): RegraForm {
    const config = regra.configuracao;
    const acao = config.acao;
    return {
        ...regraFormVazio,
        nome: regra.nome,
        descricao: regra.descricao,
        dimensao: config.dimensao,
        colunas: config.dimensao === "VALIDADE" ? [] : config.colunas.map((c) => ({ ...c })),
        marcadores: config.dimensao === "COMPLETUDE" ? (config.marcadoresAusencia ?? []).join(", ") : "",
        combinador: config.dimensao === "VALIDADE" ? config.combinador : "E",
        condicoes:
            config.dimensao === "VALIDADE"
                ? config.condicoes.map((c) => ({
                      coluna: c.coluna,
                      tipo: c.tipo,
                      operador: c.operador,
                      valor: c.valor ?? "",
                      valores: (c.valores ?? []).join("\n"),
                      vocabularioId: c.vocabularioId ?? "",
                  }))
                : [],
        acaoTipo: acao?.tipo ?? "SEM_ACAO",
        acaoColuna: acao?.coluna ?? "",
        acaoCaixa: acao?.caixa ?? "",
        acaoValor: acao?.valor ?? "",
    };
}

/** Converte o caminho de erro do servidor ("condicoes[0].valor") no campo do formulário. */
export function campoDoFormulario(campo: string): string | null {
    const caminho = campo.replace(/\[(\d+)\]/g, ".$1");
    const mapa: Record<string, string> = {
        marcadoresAusencia: "marcadores",
        "acao.tipo": "acaoTipo",
        "acao.coluna": "acaoColuna",
        "acao.caixa": "acaoCaixa",
        "acao.valor": "acaoValor",
        acao: "acaoTipo",
    };
    if (mapa[caminho]) return mapa[caminho];
    if (
        /^(colunas|condicoes)(\.\d+(\.(nome|tipo|coluna|operador|valor|valores|vocabularioId))?)?$/.test(caminho) ||
        ["dimensao", "combinador", "nome"].includes(caminho)
    ) {
        return caminho;
    }
    return null;
}
