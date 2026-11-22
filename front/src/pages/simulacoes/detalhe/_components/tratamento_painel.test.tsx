import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { datasetExemplo, simulacaoConcluida } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoAnalista } from "@/test/servidor";
import { parametros } from "@/test/setup";
import type { ResultadoTratamento } from "@/types/treatments";
import { SimulacaoDetalheTela } from "./simulacao_detalhe_tela";

const regraRemocao = {
    regraId: "r-id",
    revisao: 1,
    nome: "Atendimento sem repetição",
    ordem: 0,
    configuracao: { dimensao: "UNICIDADE" as const, colunas: [{ nome: "id", tipo: "TEXTO" as const }], acao: { tipo: "REMOVER_REPETICOES" as const } },
};
const simulacao = {
    ...simulacaoConcluida,
    configuracaoExecutada: { ...simulacaoConcluida.configuracaoExecutada, regras: [regraRemocao, ...simulacaoConcluida.configuracaoExecutada.regras] },
};
const resultado: ResultadoTratamento = {
    simulacaoId: "s1",
    extratoId: "e1",
    instanteUtc: "2026-11-21T12:05:00.000Z",
    versaoEntrada: { id: "v2", numero: 2, hashSha256: "a".repeat(64) },
    versaoSaida: { ...datasetExemplo.versaoAtual!, id: "v3", numero: 3, origem: "TRATAMENTO" },
    totalLinhasAlteradas: 2,
    totalLinhasRemovidas: 1,
    totalLinhasAfetadas: 3,
};

describe("TratamentoPainel (T05, RF004, RN03)", () => {
    beforeEach(() => {
        parametros.atual = { id: "s1" };
        servidor.use(http.get(`${API}/simulacoes/s1`, () => HttpResponse.json(simulacao)));
    });

    it("lista as ações na ordem de aplicação, com a remoção de repetições por último", async () => {
        renderizar(<SimulacaoDetalheTela />);
        const painel = (await screen.findByRole("heading", { name: "Aplicar tratamento" })).closest("section")!;
        const itens = within(painel)
            .getAllByRole("listitem")
            .map((li) => li.textContent);
        expect(itens[0]).toContain("Preencher vazio");
        expect(itens[1]).toContain("Remover repetições");
    });

    it("exige marcar a revisão antes de confirmar e envia a confirmação explícita", async () => {
        let corpo: unknown;
        servidor.use(
            http.post(`${API}/tratamentos`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json(resultado, { status: 201 });
            }),
        );
        const { usuario } = renderizar(<SimulacaoDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: "Revisar e aplicar" }));
        const dialogo = await screen.findByRole("dialog");
        expect(within(dialogo).getByText(/Serão alteradas 2 linha\(s\) e removidas 1/)).toBeInTheDocument();
        const aplicar = within(dialogo).getByRole("button", { name: "Aplicar tratamento" });
        expect(aplicar).toBeDisabled();
        await usuario.click(within(dialogo).getByText("Revisei as ações, a ordem e a prévia das alterações."));
        expect(aplicar).toBeEnabled();
        await usuario.click(aplicar);
        expect(await screen.findByText("Tratamento confirmado")).toBeInTheDocument();
        expect(corpo).toEqual({ simulacaoId: "s1", confirmado: true });
        expect(screen.getByText("v3")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Ver extrato de auditoria" })).toHaveAttribute("href", "/auditoria/e1");
    });

    it("mostra no modal a recusa de reaplicação e não registra resultado", async () => {
        servidor.use(http.post(`${API}/tratamentos`, () => erroApi(409, "SIMULACAO_JA_APLICADA", "Esta simulação já foi aplicada e não pode ser reaplicada.")));
        const { usuario } = renderizar(<SimulacaoDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: "Revisar e aplicar" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.click(within(dialogo).getByText("Revisei as ações, a ordem e a prévia das alterações."));
        await usuario.click(within(dialogo).getByRole("button", { name: "Aplicar tratamento" }));
        expect(await within(dialogo).findByText("Esta simulação já foi aplicada e não pode ser reaplicada.")).toBeInTheDocument();
        expect(screen.queryByText("Tratamento confirmado")).not.toBeInTheDocument();
    });

    it("informa quando não há alterações previstas", async () => {
        servidor.use(
            http.get(`${API}/simulacoes/s1`, () => HttpResponse.json({ ...simulacao, aplicavel: false, totalPrevistoAlteradas: 0, totalPrevistoRemovidas: 0 })),
        );
        renderizar(<SimulacaoDetalheTela />);
        expect(await screen.findByText("Não há alterações previstas")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Revisar e aplicar" })).not.toBeInTheDocument();
    });

    it("não oferece aplicação para simulação fora de vigência ou perfil sem RF004", async () => {
        servidor.use(http.get(`${API}/simulacoes/s1`, () => HttpResponse.json({ ...simulacao, status: "INVALIDADA", vigente: false, aplicavel: false })));
        renderizar(<SimulacaoDetalheTela />);
        await screen.findByText("Simulação invalidada");
        expect(screen.queryByRole("button", { name: "Revisar e aplicar" })).not.toBeInTheDocument();
    });

    it("esconde o painel para quem só consulta simulações", async () => {
        renderizar(<SimulacaoDetalheTela />, { sessao: { ...sessaoAnalista, permissoes: ["SIMULACAO_CONSULTAR"] } });
        await screen.findByText("Violações por regra");
        await waitFor(() => expect(screen.queryByRole("heading", { name: "Aplicar tratamento" })).not.toBeInTheDocument());
    });
});
