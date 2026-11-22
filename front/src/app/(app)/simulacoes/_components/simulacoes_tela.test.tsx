import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { conjuntoExemplo, datasetExemplo, simulacaoConcluida, simulacaoEmExecucao } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor } from "@/test/servidor";
import { navegacao } from "@/test/setup";
import { SimulacoesTela } from "./simulacoes_tela";

async function selecionar(usuario: ReturnType<typeof renderizar>["usuario"], rotulo: RegExp, opcao: RegExp) {
    await usuario.click(screen.getByRole("button", { name: rotulo }));
    await usuario.click(await screen.findByRole("option", { name: opcao }));
}

describe("SimulacoesTela (T04, RF003)", () => {
    beforeEach(() => {
        servidor.use(
            http.get(`${API}/datasets`, () => HttpResponse.json([datasetExemplo])),
            http.get(`${API}/datasets/d1`, () => HttpResponse.json({ ...datasetExemplo, versoes: [datasetExemplo.versaoAtual] })),
            http.get(`${API}/conjuntos`, () => HttpResponse.json([conjuntoExemplo, { ...conjuntoExemplo, id: "c2", nome: "Outro", datasets: [] }])),
            http.get(`${API}/simulacoes`, () => HttpResponse.json([simulacaoConcluida])),
        );
    });

    it("solicita a simulação com versão e conjunto associado e abre o acompanhamento", async () => {
        let corpo: unknown;
        servidor.use(
            http.post(`${API}/simulacoes`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json(simulacaoEmExecucao, { status: 202 });
            }),
        );
        const { usuario } = renderizar(<SimulacoesTela />);
        await screen.findByRole("button", { name: /Dataset/ });
        await waitFor(() => expect(screen.getByRole("button", { name: /Dataset/ })).toBeEnabled());
        await selecionar(usuario, /Dataset/, /Atendimentos 2025/);
        await selecionar(usuario, /Versão/, /^v2/);
        await usuario.click(screen.getByRole("button", { name: /Conjunto de regras/ }));
        expect(screen.queryByRole("option", { name: /Outro/ })).not.toBeInTheDocument();
        await usuario.click(await screen.findByRole("option", { name: /Conjunto atendimentos/ }));
        expect(await screen.findByText("Concluída")).toBeInTheDocument();
        await usuario.click(screen.getByRole("button", { name: "Simular" }));
        await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/simulacoes/s1"));
        expect(corpo).toEqual({ versaoId: "v2", conjuntoId: "c1" });
    });

    it("mostra a recusa por configuração incompatível sem registrar simulação", async () => {
        servidor.use(
            http.post(`${API}/simulacoes`, () =>
                erroApi(422, "CONFIGURACAO_INCOMPATIVEL", "As regras referenciam colunas inexistentes nesta versão do dataset.", [
                    { campo: "Regra X", mensagem: 'Coluna "cpf" inexistente no dataset.' },
                ]),
            ),
        );
        const { usuario } = renderizar(<SimulacoesTela />);
        await waitFor(() => expect(screen.getByRole("button", { name: /Dataset/ })).toBeEnabled());
        await selecionar(usuario, /Dataset/, /Atendimentos 2025/);
        await selecionar(usuario, /Versão/, /^v2/);
        await selecionar(usuario, /Conjunto de regras/, /Conjunto atendimentos/);
        await usuario.click(screen.getByRole("button", { name: "Simular" }));
        expect(await screen.findByText("As regras referenciam colunas inexistentes nesta versão do dataset.")).toBeInTheDocument();
        expect(screen.getByText('Coluna "cpf" inexistente no dataset.')).toBeInTheDocument();
        expect(navegacao.push).not.toHaveBeenCalled();
    });
});
