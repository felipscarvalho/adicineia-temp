import { screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { datasetExemplo } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, servidor, sessaoAnalista } from "@/test/servidor";
import { navegacao, parametros } from "@/test/setup";
import type { DatasetDetalhe } from "@/types/datasets";
import { DatasetDetalheTela } from "./dataset_detalhe_tela";

const v1 = { ...datasetExemplo.versaoAtual!, id: "v1", numero: 1, versaoPredecessoraId: null, hashSha256: "b".repeat(64) };
const detalhe: DatasetDetalhe = { ...datasetExemplo, versoes: [v1, datasetExemplo.versaoAtual!] };

function registros(versaoId: string, pagina: number) {
    return {
        versaoId,
        colunas: ["id", "sexo"],
        pagina,
        tamanho: 20,
        totalRegistros: 24,
        registros: [{ linha: (pagina - 1) * 20 + 1, valores: { id: versaoId === "v1" ? "orig" : "A001", sexo: "=1+1" } }],
    };
}

describe("DatasetDetalheTela (T01, RF001, RN04)", () => {
    beforeEach(() => {
        parametros.atual = { id: "d1" };
        servidor.use(
            http.get(`${API}/datasets/d1`, () => HttpResponse.json(detalhe)),
            http.get(`${API}/datasets/d1/versoes/:versaoId/registros`, ({ params, request }) =>
                HttpResponse.json(registros(String(params.versaoId), Number(new URL(request.url).searchParams.get("pagina")))),
            ),
        );
    });

    it("mostra metadados, histórico de versões e registros da versão atual como texto", async () => {
        renderizar(<DatasetDetalheTela />);
        expect(await screen.findByRole("heading", { name: "Atendimentos 2025" })).toBeInTheDocument();
        expect(screen.getByText("derivada de v1")).toBeInTheDocument();
        expect(await screen.findByText("A001")).toBeInTheDocument();
        expect(screen.getByText("=1+1")).toBeInTheDocument();
        expect(screen.getByText("Página 1 de 2 · 24 itens")).toBeInTheDocument();
    });

    it("pagina os registros e troca a versão exibida", async () => {
        const { usuario } = renderizar(<DatasetDetalheTela />);
        await screen.findByText("A001");
        await usuario.click(screen.getByRole("button", { name: "Próxima" }));
        expect(await screen.findByText("21")).toBeInTheDocument();
        await usuario.click(screen.getByRole("button", { name: "Ver registros da v1" }));
        expect(await screen.findByText("orig")).toBeInTheDocument();
    });

    it("edita só nome e descrição com Salvar ativo apenas após mudança", async () => {
        let corpo: unknown;
        servidor.use(
            http.patch(`${API}/datasets/d1`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json({ ...datasetExemplo, nome: "Renomeado" });
            }),
        );
        const { usuario } = renderizar(<DatasetDetalheTela />);
        const nome = await screen.findByLabelText(/Nome/);
        expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
        await usuario.clear(nome);
        await usuario.type(nome, "Renomeado");
        await usuario.click(screen.getByRole("button", { name: "Salvar" }));
        await waitFor(() => expect(corpo).toEqual({ nome: "Renomeado", descricao: "Base sintética" }));
    });

    it("descarta alterações e volta aos dados salvos", async () => {
        const { usuario } = renderizar(<DatasetDetalheTela />);
        const nome = await screen.findByLabelText(/Nome/);
        await usuario.type(nome, " (rascunho)");
        await usuario.click(screen.getByRole("button", { name: "Descartar" }));
        expect(nome).toHaveValue("Atendimentos 2025");
    });

    it("exclui logicamente após confirmação e volta à listagem", async () => {
        let excluiu = false;
        servidor.use(
            http.delete(`${API}/datasets/d1`, () => {
                excluiu = true;
                return HttpResponse.json({ ...datasetExemplo, situacao: "EXCLUIDO_LOGICAMENTE" });
            }),
        );
        const { usuario } = renderizar(<DatasetDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: "Excluir" }));
        const dialogo = await screen.findByRole("dialog");
        expect(within(dialogo).getByText(/Versões, arquivos e auditoria permanecem preservados/)).toBeInTheDocument();
        await usuario.click(within(dialogo).getByRole("button", { name: "Excluir" }));
        await waitFor(() => expect(navegacao.push).toHaveBeenCalledWith("/datasets"));
        expect(excluiu).toBe(true);
    });

    it("importa nova versão vinculada", async () => {
        let recebido: FormData | undefined;
        servidor.use(
            http.post(`${API}/datasets/d1/versoes`, async ({ request }) => {
                recebido = await request.formData();
                return HttpResponse.json({ ...v1, id: "v3", numero: 3 }, { status: 201 });
            }),
        );
        const { usuario } = renderizar(<DatasetDetalheTela />);
        await usuario.click(await screen.findByRole("button", { name: "Nova versão" }));
        const dialogo = await screen.findByRole("dialog");
        await usuario.upload(dialogo.querySelector('input[type="file"]') as HTMLInputElement, new File(["id\n1\n"], "v3.csv", { type: "text/csv" }));
        await usuario.click(within(dialogo).getByRole("button", { name: "Importar versão" }));
        await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
        expect((recebido?.get("arquivo") as File).name).toBe("v3.csv");
    });

    it("dataset excluído fica só leitura, sem ações", async () => {
        servidor.use(
            http.get(`${API}/datasets/d1`, () => HttpResponse.json({ ...detalhe, situacao: "EXCLUIDO_LOGICAMENTE", excluidoEm: "2026-11-21T12:00:00Z" })),
        );
        renderizar(<DatasetDetalheTela />);
        expect(await screen.findByText("Dataset excluído logicamente")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Nova versão" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Salvar" })).not.toBeInTheDocument();
    });

    it("sem permissão de edição mostra a mesma estrutura só para leitura", async () => {
        renderizar(<DatasetDetalheTela />, { sessao: { ...sessaoAnalista, permissoes: ["DATASET_CONSULTAR"] } });
        expect(await screen.findByRole("heading", { name: "Atendimentos 2025" })).toBeInTheDocument();
        expect(screen.queryByRole("textbox", { name: /Nome/ })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    });
});
