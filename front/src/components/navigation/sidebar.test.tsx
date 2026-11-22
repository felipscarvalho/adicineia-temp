import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderizar } from "@/test/render";
import { sessaoAnalista, sessaoGestor } from "@/test/servidor";
import type { Operacao } from "@/types/auth";
import { NAVEGACAO, filtrarNavegacao } from "./navegacao";
import { Sidebar } from "./sidebar";

function renderizarSidebar(permissoes: Operacao[]) {
    const aoSair = vi.fn();
    renderizar(<Sidebar secoes={filtrarNavegacao(NAVEGACAO, permissoes)} usuario={sessaoAnalista.usuario} aoSair={aoSair} />);
    return aoSair;
}

describe("Sidebar filtrada por permissão (RF007, seção 8.3)", () => {
    it("mostra ao analista todas as telas", () => {
        renderizarSidebar(sessaoAnalista.permissoes);
        for (const rotulo of ["Datasets", "Regras", "Conjuntos", "Vocabulários", "Simulações", "Diagnóstico", "Auditoria"]) {
            expect(screen.getByRole("link", { name: rotulo })).toBeInTheDocument();
        }
    });

    it("mostra ao gestor somente diagnóstico e auditoria", () => {
        renderizarSidebar(sessaoGestor.permissoes);
        expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Diagnóstico", "Auditoria"]);
        expect(screen.queryByText("Dados")).not.toBeInTheDocument();
    });

    it("mostra à equipe técnica somente a auditoria", () => {
        renderizarSidebar(["SESSAO_PROPRIA", "AUDITORIA_CONSULTAR", "AUDITORIA_EXPORTAR"]);
        expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Auditoria"]);
    });

    it("aciona o logout pelo botão Sair", async () => {
        const aoSair = renderizarSidebar(sessaoAnalista.permissoes);
        const botoes = screen.getAllByRole("button");
        await botoes[botoes.length - 1].click();
        expect(aoSair).toHaveBeenCalled();
    });
});
