import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { simulacaoConcluida, simulacaoEmExecucao } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, servidor } from "@/test/servidor";
import { parametros } from "@/test/setup";
import { SimulacaoDetalheTela } from "./simulacao_detalhe_tela";

describe("SimulacaoDetalheTela (T04, RF003, ADR-008)", () => {
    beforeEach(() => {
        parametros.atual = { id: "s1" };
    });

    it("consulta o estado enquanto em execução e mostra os resultados ao concluir", async () => {
        let consultas = 0;
        servidor.use(
            http.get(`${API}/simulacoes/s1`, () => {
                consultas += 1;
                return HttpResponse.json(consultas < 2 ? simulacaoEmExecucao : simulacaoConcluida);
            }),
        );
        renderizar(<SimulacaoDetalheTela />);
        expect(await screen.findByText(/Simulação em execução desde/)).toBeInTheDocument();
        expect(await screen.findByText("Violações por regra", {}, { timeout: 4000 })).toBeInTheDocument();
        expect(consultas).toBeGreaterThanOrEqual(2);
        const linha = screen.getByText("1. Sexo informado").closest("tr")!;
        expect(within(linha).getByText("3, 8, 14")).toBeInTheDocument();
        expect(within(linha).getByText("87.50%")).toBeInTheDocument();
        expect(screen.getByText("Conferido: original intacto")).toBeInTheDocument();
        expect(screen.getByText("“NAO_INFORMADO”")).toBeInTheDocument();
        expect(screen.getByText("Linha removida")).toBeInTheDocument();
    });

    it("informa tempo esgotado e não exibe resultado incompleto", async () => {
        servidor.use(
            http.get(`${API}/simulacoes/s1`, () =>
                HttpResponse.json({
                    ...simulacaoEmExecucao,
                    status: "TEMPO_ESGOTADO",
                    mensagem: "A simulação não terminou em 60 segundos e foi cancelada; a aplicação permanece desabilitada.",
                    vigente: false,
                }),
            ),
        );
        renderizar(<SimulacaoDetalheTela />);
        expect(await screen.findByRole("status", { name: "" })).toHaveTextContent("Tempo esgotado");
        expect(screen.getByText(/O resultado incompleto não pode ser aplicado/)).toBeInTheDocument();
        expect(screen.queryByText("Violações por regra")).not.toBeInTheDocument();
    });

    it("explica a invalidação após mudança das regras", async () => {
        servidor.use(
            http.get(`${API}/simulacoes/s1`, () =>
                HttpResponse.json({
                    ...simulacaoConcluida,
                    status: "INVALIDADA",
                    vigente: false,
                    aplicavel: false,
                    motivoNaoVigente: "As regras foram alteradas depois da simulação; execute nova simulação.",
                }),
            ),
        );
        renderizar(<SimulacaoDetalheTela />);
        expect(await screen.findByText("Simulação invalidada")).toBeInTheDocument();
        expect(screen.getByText(/As regras foram alteradas depois da simulação/)).toBeInTheDocument();
    });

    it("limita a lista de linhas violadas e permite expandir", async () => {
        const muitas = Array.from({ length: 40 }, (_, i) => i + 1);
        servidor.use(
            http.get(`${API}/simulacoes/s1`, () =>
                HttpResponse.json({ ...simulacaoConcluida, resultados: [{ ...simulacaoConcluida.resultados[0], linhasVioladas: muitas, totalViolacoes: 40 }] }),
            ),
        );
        const { usuario } = renderizar(<SimulacaoDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: "Mostrar todas (40)" }));
        expect(screen.getByText(muitas.join(", "))).toBeInTheDocument();
    });
});
