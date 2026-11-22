import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { diagnosticoParcial } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoGestor } from "@/test/servidor";
import { DiagnosticoTela } from "./diagnostico_tela";

const versoes = [
    { datasetId: "d1", datasetNome: "Internações", versaoId: "v1", numero: 1, criadoEm: "2026-11-20T10:00:00Z", possuiAvaliacao: true },
    { datasetId: "d1", datasetNome: "Internações", versaoId: "v2", numero: 2, criadoEm: "2026-11-21T10:00:00Z", possuiAvaliacao: false },
];

async function escolherVersao(usuario: ReturnType<typeof renderizar>["usuario"], rotulo: RegExp) {
    await usuario.click(await screen.findByRole("button", { name: /Versão do dataset/ }));
    await usuario.click(await screen.findByRole("option", { name: rotulo }));
}

describe("DiagnosticoTela (T06, RF005, RN01)", () => {
    beforeEach(() => {
        servidor.use(
            http.get(`${API}/diagnosticos/versoes`, () => HttpResponse.json(versoes)),
            http.get(`${API}/diagnosticos/versoes/v1`, () => HttpResponse.json(diagnosticoParcial)),
            http.get(`${API}/diagnosticos/versoes/v2`, () =>
                erroApi(404, "SEM_AVALIACAO", "Não há avaliação para esta versão. Execute uma simulação (UC-03) para obter o diagnóstico."),
            ),
        );
        Object.assign(URL, { createObjectURL: vi.fn(() => "blob:x"), revokeObjectURL: vi.fn() });
    });
    afterEach(() => vi.restoreAllMocks());

    it("mostra sempre os três cartões, com Não avaliada sem percentual e a cobertura parcial", async () => {
        const { usuario } = renderizar(<DiagnosticoTela />, { sessao: sessaoGestor });
        await escolherVersao(usuario, /Internações · v1/);
        const indicadores = await screen.findByRole("region", { name: "Indicadores" });
        const cartoes = within(indicadores).getAllByRole("article");
        expect(cartoes.map((c) => c.getAttribute("aria-label"))).toEqual(["Unicidade", "Completude", "Validade"]);
        expect(within(cartoes[0]).getByText("Não avaliada")).toBeInTheDocument();
        expect(within(cartoes[0]).queryByText(/%/)).not.toBeInTheDocument();
        expect(within(cartoes[1]).getByText("85,71%")).toBeInTheDocument();
        expect(within(cartoes[1]).getByText("18")).toBeInTheDocument();
        expect(within(cartoes[2]).getByText("57,14%")).toBeInTheDocument();
        expect(within(cartoes[2]).getByText(/valor_total/)).toBeInTheDocument();
        expect(screen.getByText(/2 de 3 dimensões · parcial/)).toBeInTheDocument();
        expect(screen.getByText(/não constituem certificação/)).toBeInTheDocument();
    });

    it("orienta nova simulação quando a versão não tem avaliação", async () => {
        const { usuario } = renderizar(<DiagnosticoTela />, { sessao: sessaoGestor });
        await escolherVersao(usuario, /Internações · v2/);
        expect(await screen.findByText("Versão sem avaliação")).toBeInTheDocument();
        expect(screen.getByText(/Execute uma simulação/)).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Ir para simulações" })).not.toBeInTheDocument();
    });

    it("indica avaliação desatualizada e oferece simulação ao analista", async () => {
        servidor.use(
            http.get(`${API}/diagnosticos/versoes/v1`, () =>
                erroApi(409, "AVALIACAO_DESATUALIZADA", "As regras mudaram depois da última avaliação desta versão. Execute nova simulação."),
            ),
        );
        const { usuario } = renderizar(<DiagnosticoTela />);
        await escolherVersao(usuario, /Internações · v1/);
        expect(await screen.findByText("Avaliação desatualizada")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ir para simulações" })).toHaveAttribute("href", "/simulacoes");
    });

    it.each(["PDF", "XLSX"])("exporta o diagnóstico em %s", async (formato) => {
        let pedido = "";
        servidor.use(
            http.get(`${API}/diagnosticos/versoes/v1/exportar`, ({ request }) => {
                pedido = new URL(request.url).searchParams.get("formato") ?? "";
                return new HttpResponse("conteudo", {
                    headers: { "Content-Disposition": `attachment; filename="diagnostico-d1-v1.${formato.toLowerCase()}"` },
                });
            }),
        );
        const { usuario } = renderizar(<DiagnosticoTela />, { sessao: sessaoGestor });
        await escolherVersao(usuario, /Internações · v1/);
        await usuario.click(await screen.findByRole("button", { name: `Exportar ${formato}` }));
        await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
        expect(pedido).toBe(formato);
    });

    it("não abre para a equipe técnica", () => {
        renderizar(<DiagnosticoTela />, { sessao: { ...sessaoGestor, permissoes: ["SESSAO_PROPRIA", "AUDITORIA_CONSULTAR"] } });
        expect(screen.getByText("Acesso não permitido")).toBeInTheDocument();
    });
});
