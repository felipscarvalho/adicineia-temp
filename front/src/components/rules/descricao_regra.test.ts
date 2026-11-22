import { describe, expect, it } from "vitest";
import { regraIdade, regraSexo } from "@/test/fixtures";
import { descreverRegra } from "./descricao_regra";

describe("descreverRegra", () => {
    it("resume as três dimensões e a ação", () => {
        expect(descreverRegra(regraIdade.configuracao)).toBe("idade ≥ 0 E idade ≤ 120");
        expect(descreverRegra(regraSexo.configuracao)).toBe("Preenchidas: sexo (ausência: ignorado) · ação: Preencher vazio em sexo");
        expect(
            descreverRegra({
                dimensao: "UNICIDADE",
                colunas: [
                    { nome: "id", tipo: "TEXTO" },
                    { nome: "dose", tipo: "DECIMAL" },
                ],
                acao: { tipo: "REMOVER_REPETICOES" },
            }),
        ).toBe("Chave: id + dose · ação: Remover repetições");
        expect(
            descreverRegra({
                dimensao: "VALIDADE",
                combinador: "OU",
                condicoes: [
                    { coluna: "uf", tipo: "TEXTO", operador: "PERTENCE_LISTA", valores: ["SE", "AL"] },
                    { coluna: "uf", tipo: "TEXTO", operador: "VAZIO" },
                ],
            }),
        ).toBe("uf ∈ {SE, AL} OU uf está vazio");
    });
});
