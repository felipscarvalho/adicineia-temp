import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extratoExemplo } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor } from "@/test/servidor";
import { parametros } from "@/test/setup";
import type { Sessao } from "@/types/auth";
import { ExtratoTela } from "../[id]/_components/extrato_tela";
import { AuditoriaTela } from "./auditoria_tela";

const sessaoEquipe: Sessao = {
    usuario: { id: "u-equipe", nome: "Eva Equipe", email: "equipe@teste.local", papel: "EQUIPE_TECNICA" },
    permissoes: ["SESSAO_PROPRIA", "AUDITORIA_CONSULTAR", "AUDITORIA_EXPORTAR"],
    csrfToken: "csrf-equipe",
};

describe("Auditoria (T07, RF006, RN03)", () => {
    beforeEach(() => {
        parametros.atual = { id: "e1" };
        servidor.use(
            http.get(`${API}/auditoria/datasets`, () =>
                HttpResponse.json([
                    { id: "d1", nome: "Atendimentos 2025", situacao: "EXCLUIDO_LOGICAMENTE", totalExtratos: 1, ultimaIntervencao: "2026-11-21T12:05:00Z" },
                ]),
            ),
            http.get(`${API}/auditoria/extratos`, () => HttpResponse.json([extratoExemplo])),
            http.get(`${API}/auditoria/extratos/e1`, () => HttpResponse.json(extratoExemplo)),
        );
        Object.assign(URL, { createObjectURL: vi.fn(() => "blob:extrato"), revokeObjectURL: vi.fn() });
    });
    afterEach(() => vi.restoreAllMocks());

    it("permite à equipe técnica localizar os extratos, inclusive de dataset excluído", async () => {
        const { usuario } = renderizar(<AuditoriaTela />, { sessao: sessaoEquipe });
        expect(await screen.findByText("Excluído logicamente")).toBeInTheDocument();
        await usuario.click(screen.getByRole("button", { name: /Atendimentos 2025/ }));
        expect(await screen.findByText("v1 → v2")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Abrir extrato" })).toHaveAttribute("href", "/auditoria/e1");
    });

    it("mostra os campos da RN03 e as alterações por linha", async () => {
        renderizar(<ExtratoTela />, { sessao: sessaoEquipe });
        expect(await screen.findByText("2026-11-21T12:05:00.000Z")).toBeInTheDocument();
        expect(screen.getAllByText("u-analista").length).toBeGreaterThan(0);
        expect(screen.getByText("Entrada · v1")).toBeInTheDocument();
        expect(screen.getByText("Saída · v2")).toBeInTheDocument();
        expect(screen.getByText("Repetia a linha 2")).toBeInTheDocument();
        expect(screen.getByText(/sexo: “” → “NAO_INFORMADO”/)).toBeInTheDocument();
        expect(screen.getByText("Página 1 de 1 · 3 itens")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Editar|Excluir/ })).not.toBeInTheDocument();
    });

    it("exporta o PDF pelo endpoint do extrato", async () => {
        let pediu = false;
        servidor.use(
            http.get(`${API}/auditoria/extratos/e1/pdf`, () => {
                pediu = true;
                return new HttpResponse("%PDF-1.3", {
                    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="extrato-auditoria-e1.pdf"' },
                });
            }),
        );
        const { usuario } = renderizar(<ExtratoTela />, { sessao: sessaoEquipe });
        await usuario.click(await screen.findByRole("button", { name: "Exportar PDF" }));
        await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
        expect(pediu).toBe(true);
    });

    it("informa indisponibilidade do extrato sem expor detalhes", async () => {
        servidor.use(http.get(`${API}/auditoria/extratos/e1`, () => erroApi(404, "NAO_ENCONTRADO", "Extrato de auditoria indisponível.")));
        renderizar(<ExtratoTela />, { sessao: sessaoEquipe });
        expect(await screen.findByText("Extrato indisponível")).toBeInTheDocument();
        expect(screen.getByText("Extrato de auditoria indisponível.")).toBeInTheDocument();
    });

    it("informa quando não há intervenções", async () => {
        servidor.use(http.get(`${API}/auditoria/datasets`, () => HttpResponse.json([])));
        renderizar(<AuditoriaTela />, { sessao: sessaoEquipe });
        expect(await screen.findByText("Nenhuma intervenção registrada")).toBeInTheDocument();
    });
});
