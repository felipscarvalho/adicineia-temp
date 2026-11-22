import { describe, expect, it } from "vitest";
import { NAVEGACAO, filtrarNavegacao, telaInicial } from "./navegacao";

describe("navegação por perfil", () => {
    it("mantém só as seções com itens permitidos", () => {
        const secoes = filtrarNavegacao(NAVEGACAO, ["AUDITORIA_CONSULTAR"]);
        expect(secoes.map((s) => s.rotulo)).toEqual(["Rastreabilidade"]);
        expect(telaInicial(["AUDITORIA_CONSULTAR"])).toBe("/auditoria");
        expect(telaInicial(["DIAGNOSTICO_CONSULTAR", "AUDITORIA_CONSULTAR"])).toBe("/diagnosticos");
        expect(telaInicial([])).toBe("/login");
    });
});
