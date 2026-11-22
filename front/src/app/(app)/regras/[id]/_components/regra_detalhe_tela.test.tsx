import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { catalogo, regraIdade, vocabularioCid10 } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoAnalista } from "@/test/servidor";
import { navegacao, parametros } from "@/test/setup";
import { RegraDetalheTela } from "./regra_detalhe_tela";

describe("RegraDetalheTela (T03, RF002, ADR-005)", () => {
    beforeEach(() => {
        parametros.atual = { id: "r-idade" };
        servidor.use(
            http.get(`${API}/regras/r-idade`, () => HttpResponse.json(regraIdade)),
            http.get(`${API}/regras/r-idade/revisoes`, () =>
                HttpResponse.json([
                    {
                        revisao: 1,
                        nome: regraIdade.nome,
                        descricao: "",
                        dimensao: "VALIDADE",
                        configuracao: { ...regraIdade.configuracao, condicoes: [{ coluna: "idade", tipo: "DECIMAL", operador: "MAIOR", valor: "0" }] },
                        criadoPor: "u",
                        criadoEm: "2026-11-20T10:00:00Z",
                    },
                    {
                        revisao: 2,
                        nome: regraIdade.nome,
                        descricao: "",
                        dimensao: "VALIDADE",
                        configuracao: regraIdade.configuracao,
                        criadoPor: "u",
                        criadoEm: "2026-11-21T10:00:00Z",
                    },
                ]),
            ),
            http.get(`${API}/catalogo`, () => HttpResponse.json(catalogo)),
            http.get(`${API}/vocabularios`, () => HttpResponse.json([vocabularioCid10])),
        );
    });

    it("carrega a configuração salva no construtor e lista as revisões", async () => {
        renderizar(<RegraDetalheTela />);
        expect(await screen.findByRole("heading", { name: "Idade entre 0 e 120" })).toBeInTheDocument();
        expect(screen.getAllByDisplayValue("idade")).toHaveLength(2);
        expect(screen.getByDisplayValue("120")).toBeInTheDocument();
        expect(screen.getByText("idade > 0")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    });

    it("salva nova revisão com a configuração editada", async () => {
        let corpo: { configuracao?: { condicoes: { valor?: string }[] } } = {};
        servidor.use(
            http.put(`${API}/regras/r-idade`, async ({ request }) => {
                corpo = (await request.json()) as typeof corpo;
                return HttpResponse.json({ ...regraIdade, revisao: 3 });
            }),
        );
        const { usuario } = renderizar(<RegraDetalheTela />);
        const maximo = await screen.findByDisplayValue("120");
        await usuario.clear(maximo);
        await usuario.type(maximo, "110");
        await usuario.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(corpo.configuracao?.condicoes[1].valor).toBe("110"));
    });

    it("mostra o conflito com conjunto existente devolvido pelo servidor", async () => {
        servidor.use(
            http.put(`${API}/regras/r-idade`, () =>
                erroApi(422, "CONJUNTO_INCOMPATIVEL", 'A alteração torna o conjunto "C" inconsistente e não foi salva.', [
                    { campo: "regras[1]", mensagem: "Duas ações de escrita na coluna idade." },
                ]),
            ),
        );
        const { usuario } = renderizar(<RegraDetalheTela />);
        await usuario.type(await screen.findByDisplayValue("120"), "0");
        await usuario.click(screen.getByRole("button", { name: "Salvar" }));
        expect(await screen.findByText('A alteração torna o conjunto "C" inconsistente e não foi salva.')).toBeInTheDocument();
        expect(screen.getByText("regras[1]: Duas ações de escrita na coluna idade.")).toBeInTheDocument();
    });

    it("exclui logicamente após confirmação", async () => {
        servidor.use(http.delete(`${API}/regras/r-idade`, () => HttpResponse.json({ ...regraIdade, situacao: "EXCLUIDO_LOGICAMENTE" })));
        const { usuario } = renderizar(<RegraDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
        const botoes = await screen.findAllByRole("button", { name: "Excluir" });
        await usuario.click(botoes[botoes.length - 1]);
        await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/regras"));
    });

    it("sem REGRA_MANTER exibe a mesma estrutura só para leitura", async () => {
        renderizar(<RegraDetalheTela />, { sessao: { ...sessaoAnalista, permissoes: ["REGRA_CONSULTAR"] } });
        await screen.findByRole("heading", { name: "Idade entre 0 e 120" });
        expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Adicionar condição" })).not.toBeInTheDocument();
        expect(screen.getByDisplayValue("120")).toBeDisabled();
    });
});
