import { describe, expect, it } from "vitest";
import { LIMITE_BYTES } from "@/types/datasets";
import { importarDatasetSchema } from "./importar_dataset";

const arquivo = (nome: string, tamanho: number) => {
    const conteudo = new File(["x".repeat(Math.min(tamanho, 10))], nome, { type: "text/csv" });
    Object.defineProperty(conteudo, "size", { value: tamanho });
    return conteudo;
};

function mensagens(entrada: Record<string, unknown>) {
    const resultado = importarDatasetSchema.safeParse({ nome: "Base", descricao: "", separador: "VIRGULA", ...entrada });
    return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
}

describe("importarDatasetSchema (P1, seção 8.3)", () => {
    it("aceita CSV de até 10.000.000 bytes", () => {
        expect(mensagens({ arquivo: arquivo("base.csv", LIMITE_BYTES) })).toEqual([]);
        expect(mensagens({ arquivo: arquivo("BASE.CSV", 1) })).toEqual([]);
    });

    it.each([
        ["extensão diferente", arquivo("base.xlsx", 10), "O arquivo deve ter a extensão .csv."],
        ["arquivo vazio", arquivo("base.csv", 0), "O arquivo está vazio."],
        ["limite + 1 byte", arquivo("base.csv", LIMITE_BYTES + 1), "O arquivo excede o limite de 10.000.000 bytes."],
        ["sem arquivo", undefined, "Selecione um arquivo CSV."],
    ])("rejeita %s", (_caso, entrada, mensagem) => {
        expect(mensagens({ arquivo: entrada })).toContain(mensagem);
    });

    it("exige nome e separador válidos", () => {
        expect(mensagens({ nome: "  ", arquivo: arquivo("a.csv", 1) })).toContain("Informe o nome do dataset.");
        expect(mensagens({ separador: "TAB", arquivo: arquivo("a.csv", 1) })).toContain("Escolha o separador.");
    });
});
