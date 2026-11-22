import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { conjuntoExemplo, datasetExemplo, regraIdade, regraSexo } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor } from "@/test/servidor";
import { parametros } from "@/test/setup";
import { ConjuntoDetalheTela } from "../[id]/_components/conjunto_detalhe_tela";
import { ConjuntosTela } from "./conjuntos_tela";

describe("Conjuntos de regras (T02, RF002)", () => {
    beforeEach(() => {
        parametros.atual = { id: "c1" };
        servidor.use(
            http.get(`${API}/conjuntos`, () => HttpResponse.json([conjuntoExemplo])),
            http.get(`${API}/regras`, () => HttpResponse.json([regraSexo, regraIdade])),
            http.get(`${API}/conjuntos/c1`, () => HttpResponse.json(conjuntoExemplo)),
            http.get(`${API}/conjuntos/c1/revisoes`, () =>
                HttpResponse.json([
                    { revisao: 1, nome: "C", descricao: "", itens: [], motivo: "CRIACAO", criadoPor: "u", criadoEm: "2026-11-20T10:00:00Z" },
                    { revisao: 3, nome: "C", descricao: "", itens: [{}, {}], motivo: "REVISAO_REGRA", criadoPor: "u", criadoEm: "2026-11-21T10:00:00Z" },
                ]),
            ),
            http.get(`${API}/datasets`, () => HttpResponse.json([datasetExemplo, { ...datasetExemplo, id: "d2", nome: "Vacinação" }])),
        );
    });

    it("lista conjuntos com dimensões das regras e datasets associados", async () => {
        renderizar(<ConjuntosTela />);
        const linha = (await screen.findByText("Conjunto atendimentos")).closest("tr")!;
        expect(within(linha).getByText("Completude")).toBeInTheDocument();
        expect(within(linha).getByText("Validade")).toBeInTheDocument();
        expect(within(linha).getByText("r3")).toBeInTheDocument();
    });

    it("cria conjunto com regras na ordem escolhida", async () => {
        let corpo: unknown;
        servidor.use(
            http.post(`${API}/conjuntos`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json(conjuntoExemplo, { status: 201 });
            }),
        );
        const { usuario } = renderizar(<ConjuntosTela />);
        await usuario.click(await screen.findByRole("button", { name: "Novo conjunto" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.type(within(dialogo).getByLabelText(/^Nome/), "Novo");
        for (const regra of ["Idade entre 0 e 120", "Sexo informado"]) {
            await usuario.click(await within(dialogo).findByRole("button", { name: /Adicionar regra/ }));
            await usuario.click(await screen.findByRole("option", { name: new RegExp(regra) }));
        }
        await usuario.click(within(dialogo).getByRole("button", { name: "Criar conjunto" }));
        await waitFor(() => expect(corpo).toEqual({ nome: "Novo", descricao: "", regras: ["r-idade", "r-sexo"] }));
    });

    it("reordena as regras e salva nova revisão", async () => {
        let corpo: unknown;
        servidor.use(
            http.put(`${API}/conjuntos/c1`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json({ ...conjuntoExemplo, revisao: 4 });
            }),
        );
        const { usuario } = renderizar(<ConjuntoDetalheTela />);
        await screen.findByRole("heading", { name: "Conjunto atendimentos" });
        const itens = screen
            .getAllByRole("listitem")
            .filter((li) => li.textContent?.includes("Idade entre 0 e 120") && within(li).queryAllByRole("button").length > 0);
        await usuario.click(within(itens[0]).getByRole("button", { name: "Subir" }));
        await usuario.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(corpo).toEqual({ nome: "Conjunto atendimentos", descricao: "", regras: ["r-idade", "r-sexo"] }));
        expect(screen.getByText("Revisão de regra")).toBeInTheDocument();
    });

    it("associa a dataset e mostra a recusa por coluna inexistente", async () => {
        servidor.use(
            http.put(`${API}/conjuntos/c1/datasets/d2`, () =>
                erroApi(422, "CONJUNTO_INCOMPATIVEL_COM_DATASET", "O conjunto referencia colunas que não existem na versão atual do dataset."),
            ),
        );
        const { usuario } = renderizar(<ConjuntoDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: /Associar a um dataset ativo/ }));
        await usuario.click(await screen.findByRole("option", { name: /Vacinação/ }));
        await usuario.click(screen.getByRole("button", { name: "Associar" }));
        expect(await screen.findByText("O conjunto referencia colunas que não existem na versão atual do dataset.")).toBeInTheDocument();
    });
});
