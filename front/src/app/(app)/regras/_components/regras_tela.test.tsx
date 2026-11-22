import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { catalogo, regraIdade, regraSexo, vocabularioCid10 } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoGestor } from "@/test/servidor";
import { RegrasTela } from "./regras_tela";

async function escolher(usuario: ReturnType<typeof renderizar>["usuario"], contexto: HTMLElement, rotulo: RegExp, opcao: string) {
    await usuario.click(within(contexto).getByRole("button", { name: rotulo }));
    await usuario.click(await screen.findByRole("option", { name: new RegExp(opcao) }));
}

describe("RegrasTela (T02/T03, RF002)", () => {
    beforeEach(() => {
        servidor.use(
            http.get(`${API}/regras`, () => HttpResponse.json([regraIdade, regraSexo])),
            http.get(`${API}/catalogo`, () => HttpResponse.json(catalogo)),
            http.get(`${API}/vocabularios`, () => HttpResponse.json([vocabularioCid10])),
        );
    });

    it("lista regras com dimensão, resumo e revisão", async () => {
        renderizar(<RegrasTela />);
        const linha = (await screen.findByText("Idade entre 0 e 120")).closest("tr")!;
        expect(within(linha).getByText("Validade")).toBeInTheDocument();
        expect(within(linha).getByText("idade ≥ 0 E idade ≤ 120")).toBeInTheDocument();
        expect(within(linha).getByText("r2")).toBeInTheDocument();
    });

    it("cria regra de completude com ação do catálogo", async () => {
        let corpo: unknown;
        servidor.use(
            http.post(`${API}/regras`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json({ ...regraSexo, id: "nova" }, { status: 201 });
            }),
        );
        const { usuario } = renderizar(<RegrasTela />);
        await usuario.click(await screen.findByRole("button", { name: "Nova regra" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.type(await within(dialogo).findByLabelText(/Nome da regra/), "Sexo informado");
        await usuario.type(within(dialogo).getByLabelText("Coluna 1"), "sexo");
        await usuario.type(within(dialogo).getByLabelText(/Marcadores de ausência/), "ignorado");
        await escolher(usuario, dialogo, /Ação/, "Preencher campo vazio");
        await escolher(usuario, dialogo, /Coluna da ação/, "sexo");
        await usuario.type(within(dialogo).getByLabelText(/Valor literal/), "NAO_INFORMADO");
        await usuario.click(within(dialogo).getByRole("button", { name: "Criar regra" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(corpo).toEqual({
            nome: "Sexo informado",
            descricao: "",
            configuracao: {
                dimensao: "COMPLETUDE",
                colunas: [{ nome: "sexo", tipo: "TEXTO" }],
                marcadoresAusencia: ["ignorado"],
                acao: { tipo: "PREENCHER_VAZIO", coluna: "sexo", valor: "NAO_INFORMADO" },
            },
        });
    });

    it("cria regra de validade com condição numérica e mostra no campo o erro apontado pelo servidor", async () => {
        servidor.use(
            http.post(`${API}/regras`, () =>
                erroApi(422, "CONFIGURACAO_INVALIDA", "A configuração da regra não atende ao catálogo e não foi salva.", [
                    { campo: "condicoes[0].valor", mensagem: "Valor incompatível com o tipo DECIMAL." },
                ]),
            ),
        );
        const { usuario } = renderizar(<RegrasTela />);
        await usuario.click(await screen.findByRole("button", { name: "Nova regra" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.type(await within(dialogo).findByLabelText(/Nome da regra/), "Idade");
        await escolher(usuario, dialogo, /Dimensão/, "Validade");
        await usuario.click(within(dialogo).getByRole("button", { name: "Adicionar condição" }));
        await usuario.type(within(dialogo).getAllByLabelText(/^Coluna/)[0], "idade");
        await escolher(usuario, dialogo, /Tipo/, "Número decimal");
        await escolher(usuario, dialogo, /Operador/, "maior ou igual a");
        await usuario.type(within(dialogo).getByLabelText(/^Valor/), "0");
        await usuario.click(within(dialogo).getByRole("button", { name: "Criar regra" }));
        expect(await within(dialogo).findByText("A configuração da regra não atende ao catálogo e não foi salva.")).toBeInTheDocument();
        expect(within(dialogo).getByText("Valor incompatível com o tipo DECIMAL.")).toBeInTheDocument();
    });

    it("limita a cinco condições", async () => {
        const { usuario } = renderizar(<RegrasTela />);
        await usuario.click(await screen.findByRole("button", { name: "Nova regra" }));
        const dialogo = await screen.findByRole("dialog");
        await escolher(usuario, dialogo, /Dimensão/, "Validade");
        const adicionar = within(dialogo).getByRole("button", { name: "Adicionar condição" });
        for (let i = 0; i < 5; i++) {
            await usuario.click(adicionar);
        }
        expect(adicionar).toBeDisabled();
        expect(within(dialogo).getAllByText(/^Condição \d$/)).toHaveLength(5);
    });

    it("não abre para o gestor", () => {
        renderizar(<RegrasTela />, { sessao: sessaoGestor });
        expect(screen.getByText("Acesso não permitido")).toBeInTheDocument();
    });
});
