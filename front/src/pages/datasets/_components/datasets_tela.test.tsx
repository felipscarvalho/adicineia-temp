import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { datasetExemplo } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoGestor } from "@/test/servidor";
import type { Dataset } from "@/types/datasets";
import { DatasetsTela } from "./datasets_tela";

function arquivoCsv(conteudo = "id;sexo\n1;F\n") {
    return new File([conteudo], "atendimentos.csv", { type: "text/csv" });
}

describe("DatasetsTela (T01, RF001)", () => {
    it("lista os datasets ativos com versão e contagens", async () => {
        servidor.use(http.get(`${API}/datasets`, () => HttpResponse.json([datasetExemplo])));
        renderizar(<DatasetsTela />);
        const linha = (await screen.findByText("Atendimentos 2025")).closest("tr")!;
        expect(within(linha).getByText("v2 de 2")).toBeInTheDocument();
        expect(within(linha).getByText("24")).toBeInTheDocument();
        expect(within(linha).getByText("21/11/2026")).toBeInTheDocument();
    });

    it("mostra estado vazio quando não há datasets ativos", async () => {
        servidor.use(http.get(`${API}/datasets`, () => HttpResponse.json([])));
        renderizar(<DatasetsTela />);
        expect(await screen.findByText("Nenhum dataset ativo")).toBeInTheDocument();
    });

    it("bloqueia a tela para perfil sem RF001", () => {
        renderizar(<DatasetsTela />, { sessao: sessaoGestor });
        expect(screen.getByText("Acesso não permitido")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Importar dataset" })).not.toBeInTheDocument();
    });

    it("importa o CSV por multipart e atualiza a lista", async () => {
        let recebido: FormData | undefined;
        let lista: Dataset[] = [];
        servidor.use(
            http.get(`${API}/datasets`, () => HttpResponse.json(lista)),
            http.post(`${API}/datasets`, async ({ request }) => {
                recebido = await request.formData();
                lista = [datasetExemplo];
                return HttpResponse.json(datasetExemplo, { status: 201 });
            }),
        );
        const { usuario } = renderizar(<DatasetsTela />);
        await usuario.click(await screen.findByRole("button", { name: "Importar dataset" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.type(within(dialogo).getByLabelText(/Nome/), "Atendimentos 2025");
        await usuario.upload(dialogo.querySelector('input[type="file"]') as HTMLInputElement, arquivoCsv());
        expect(within(dialogo).getByText(/atendimentos\.csv · 12 bytes/)).toBeInTheDocument();
        await usuario.click(within(dialogo).getByRole("button", { name: "Importar" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect(recebido?.get("nome")).toBe("Atendimentos 2025");
        expect(recebido?.get("separador")).toBe("VIRGULA");
        expect((recebido?.get("arquivo") as File).name).toBe("atendimentos.csv");
        expect(await screen.findByText("v2 de 2")).toBeInTheDocument();
    });

    it("exibe o motivo da rejeição do servidor sem fechar o modal", async () => {
        servidor.use(
            http.get(`${API}/datasets`, () => HttpResponse.json([])),
            http.post(`${API}/datasets`, () => erroApi(422, "CABECALHO_DUPLICADO", 'O cabeçalho repete o nome de coluna "id".')),
        );
        const { usuario } = renderizar(<DatasetsTela />);
        await usuario.click(await screen.findByRole("button", { name: "Importar dataset" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.type(within(dialogo).getByLabelText(/Nome/), "Base");
        await usuario.upload(dialogo.querySelector('input[type="file"]') as HTMLInputElement, arquivoCsv("id;id\n1;2\n"));
        await usuario.click(within(dialogo).getByRole("button", { name: "Importar" }));
        expect(await within(dialogo).findByText('O cabeçalho repete o nome de coluna "id".')).toBeInTheDocument();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("valida o arquivo antes de enviar", async () => {
        servidor.use(http.get(`${API}/datasets`, () => HttpResponse.json([])));
        const { usuario } = renderizar(<DatasetsTela />);
        await usuario.click(await screen.findByRole("button", { name: "Importar dataset" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.type(within(dialogo).getByLabelText(/Nome/), "Base");
        await usuario.click(within(dialogo).getByRole("button", { name: "Importar" }));
        expect(await within(dialogo).findByText("Selecione um arquivo CSV.")).toBeInTheDocument();
    });
});
