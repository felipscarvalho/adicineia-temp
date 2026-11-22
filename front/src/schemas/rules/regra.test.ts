import { describe, expect, it } from "vitest";
import { conjuntoExemplo, regraIdade, regraSexo } from "@/test/fixtures";
import { conjuntoSchema } from "./conjunto";
import { type RegraForm, campoDoFormulario, paraConfiguracao, paraFormulario, regraFormSchema, regraFormVazio } from "./regra";

const condicao = (extra: Partial<RegraForm["condicoes"][number]> = {}) => ({
    coluna: "idade",
    tipo: "DECIMAL" as const,
    operador: "MAIOR_IGUAL",
    valor: "0",
    valores: "",
    vocabularioId: "",
    ...extra,
});

function mensagens(form: Partial<RegraForm>) {
    const resultado = regraFormSchema.safeParse({ ...regraFormVazio, nome: "Regra", ...form });
    return resultado.success ? [] : resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("regraFormSchema e conversões (RF002, seção 8.3)", () => {
    it("converte completude com marcadores e preenchimento", () => {
        const config = paraConfiguracao({
            ...regraFormVazio,
            colunas: [{ nome: " sexo ", tipo: "TEXTO" }],
            marcadores: "ignorado, IGN",
            acaoTipo: "PREENCHER_VAZIO",
            acaoColuna: "sexo",
            acaoValor: " NI ",
        });
        expect(config).toEqual({
            dimensao: "COMPLETUDE",
            colunas: [{ nome: "sexo", tipo: "TEXTO" }],
            marcadoresAusencia: ["ignorado", "IGN"],
            acao: { tipo: "PREENCHER_VAZIO", coluna: "sexo", valor: "NI" },
        });
    });

    it("converte validade com lista, vocabulário, vazio e OU, sem campos extras", () => {
        const config = paraConfiguracao({
            ...regraFormVazio,
            dimensao: "VALIDADE",
            combinador: "OU",
            condicoes: [
                condicao({ coluna: "uf", tipo: "TEXTO", operador: "PERTENCE_LISTA", valor: "x", valores: "SE\n AL \n\n" }),
                condicao({ coluna: "cid", tipo: "TEXTO", operador: "PERTENCE_VOCABULARIO", vocabularioId: "voc" }),
                condicao({ coluna: "dt", tipo: "DATA", operador: "VAZIO", valor: "ignorado" }),
            ],
        });
        expect(config).toEqual({
            dimensao: "VALIDADE",
            combinador: "OU",
            condicoes: [
                { coluna: "uf", tipo: "TEXTO", operador: "PERTENCE_LISTA", valores: ["SE", "AL"] },
                { coluna: "cid", tipo: "TEXTO", operador: "PERTENCE_VOCABULARIO", vocabularioId: "voc" },
                { coluna: "dt", tipo: "DATA", operador: "VAZIO" },
            ],
        });
    });

    it("converte unicidade com remoção de repetições sem coluna na ação", () => {
        expect(
            paraConfiguracao({
                ...regraFormVazio,
                dimensao: "UNICIDADE",
                colunas: [{ nome: "id", tipo: "TEXTO" }],
                acaoTipo: "REMOVER_REPETICOES",
                acaoColuna: "id",
            }),
        ).toEqual({
            dimensao: "UNICIDADE",
            colunas: [{ nome: "id", tipo: "TEXTO" }],
            acao: { tipo: "REMOVER_REPETICOES" },
        });
    });

    it("ida e volta preserva a configuração salva", () => {
        for (const regra of [regraIdade, regraSexo]) {
            expect(paraConfiguracao(paraFormulario(regra))).toEqual(regra.configuracao);
        }
    });

    it.each([
        [
            "mais de cinco condições",
            { dimensao: "VALIDADE" as const, condicoes: Array.from({ length: 6 }, () => condicao()) },
            "condicoes: Cada regra admite no máximo 5 condições.",
        ],
        ["validade sem condição", { dimensao: "VALIDADE" as const, condicoes: [] }, "condicoes: Adicione ao menos uma condição."],
        [
            "decimal com vírgula",
            { dimensao: "VALIDADE" as const, condicoes: [condicao({ valor: "1,5" })] },
            "condicoes.0.valor: Use ponto como separador decimal, sem milhares (ex.: 10.5).",
        ],
        [
            "data fora do formato",
            { dimensao: "VALIDADE" as const, condicoes: [condicao({ tipo: "DATA", valor: "31/12/2025" })] },
            "condicoes.0.valor: Use o formato AAAA-MM-DD.",
        ],
        [
            "lista vazia",
            { dimensao: "VALIDADE" as const, condicoes: [condicao({ tipo: "TEXTO", operador: "PERTENCE_LISTA", valores: " \n " })] },
            "condicoes.0.valores: Informe ao menos um valor da lista.",
        ],
        [
            "vocabulário sem versão",
            { dimensao: "VALIDADE" as const, condicoes: [condicao({ tipo: "TEXTO", operador: "PERTENCE_VOCABULARIO" })] },
            "condicoes.0.vocabularioId: Selecione o vocabulário oficial e a versão.",
        ],
        [
            "completude com seis colunas",
            { colunas: Array.from({ length: 6 }, (_, i) => ({ nome: `c${i}`, tipo: "TEXTO" as const })) },
            "colunas: Selecione no máximo 5 colunas.",
        ],
        ["ação sem coluna", { acaoTipo: "APARAR_ESPACOS" as const }, "acaoColuna: Escolha a coluna da ação."],
        ["caixa não escolhida", { acaoTipo: "CONVERTER_CAIXA" as const, acaoColuna: "sexo" }, "acaoCaixa: Escolha maiúsculas ou minúsculas."],
        ["preenchimento sem literal", { acaoTipo: "PREENCHER_VAZIO" as const, acaoColuna: "sexo" }, "acaoValor: Informe o valor literal de preenchimento."],
    ])("rejeita %s", (_caso, form, esperado) => {
        expect(mensagens({ colunas: [{ nome: "sexo", tipo: "TEXTO" }], ...form })).toContain(esperado);
    });

    it("exige a coluna só na dimensão em uso", () => {
        expect(mensagens({ colunas: [{ nome: " ", tipo: "TEXTO" }] })).toContain("colunas.0.nome: Informe a coluna.");
        expect(mensagens({ dimensao: "VALIDADE", colunas: [{ nome: "", tipo: "TEXTO" }], condicoes: [condicao()] })).toEqual([]);
    });

    it("mapeia os campos apontados pelo servidor para o formulário", () => {
        expect(campoDoFormulario("condicoes[0].valor")).toBe("condicoes.0.valor");
        expect(campoDoFormulario("colunas[1].nome")).toBe("colunas.1.nome");
        expect(campoDoFormulario("marcadoresAusencia")).toBe("marcadores");
        expect(campoDoFormulario("acao.coluna")).toBe("acaoColuna");
        expect(campoDoFormulario("condicoes[0].script")).toBeNull();
        expect(campoDoFormulario("Regra A")).toBeNull();
    });

    it("conjunto recusa regra repetida", () => {
        const resultado = conjuntoSchema.safeParse({ nome: conjuntoExemplo.nome, descricao: "", regras: ["a", "a"] });
        expect(resultado.success).toBe(false);
    });
});
