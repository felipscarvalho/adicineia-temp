import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { API, erroApi, servidor } from "@/test/servidor";
import { ApiError, apiDownload, apiGet, apiGetPage, apiPost } from "./api";

describe("cliente da API (lib/api.ts)", () => {
    it("devolve o data tipado da resposta", async () => {
        servidor.use(http.get(`${API}/eco`, () => HttpResponse.json({ ok: true })));
        await expect(apiGet<{ ok: boolean }>("/eco")).resolves.toEqual({ ok: true });
    });

    it("normaliza erros do backend em ApiError com código, mensagem e erros de campo", async () => {
        servidor.use(
            http.post(`${API}/regras`, () => erroApi(422, "CONFIGURACAO_INVALIDA", "Configuração inválida.", [{ campo: "condicoes", mensagem: "Informe" }])),
        );
        const erro = await apiPost("/regras", {}).catch((e: unknown) => e);
        expect(erro).toBeInstanceOf(ApiError);
        expect(erro).toMatchObject({ status: 422, codigo: "CONFIGURACAO_INVALIDA", message: "Configuração inválida." });
        expect((erro as ApiError).errosDeCampo).toEqual([{ campo: "condicoes", mensagem: "Informe" }]);
    });

    it("junta mensagens em lista (erros de validação do DTO)", async () => {
        servidor.use(
            http.get(`${API}/x`, () => HttpResponse.json({ statusCode: 400, erro: "Bad Request", mensagem: ["a inválido", "b inválido"] }, { status: 400 })),
        );
        await expect(apiGet("/x")).rejects.toMatchObject({ message: "a inválido b inválido", status: 400 });
    });

    it("informa falha de conexão sem expor detalhes técnicos", async () => {
        servidor.use(http.get(`${API}/rede`, () => HttpResponse.error()));
        await expect(apiGet("/rede")).rejects.toMatchObject({ status: 0, codigo: "SEM_CONEXAO" });
    });

    it("monta páginas no formato único", async () => {
        servidor.use(
            http.get(`${API}/lista`, ({ request }) =>
                HttpResponse.json({ linhas: [1, 2], total: 45, pagina: new URL(request.url).searchParams.get("pagina") }),
            ),
        );
        const pagina = await apiGetPage<number, { linhas: number[]; total: number }>("/lista", { pagina: 2, tamanho: 20 }, (r) => ({
            itens: r.linhas,
            total: r.total,
        }));
        expect(pagina).toEqual({ itens: [1, 2], metadata: { pagina: 2, tamanho: 20, total: 45, totalPaginas: 3 } });
    });

    it("baixa arquivos com o nome indicado pelo servidor e lê erros em blob", async () => {
        servidor.use(
            http.get(
                `${API}/arquivo`,
                () =>
                    new HttpResponse("conteudo", {
                        headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="extrato.pdf"' },
                    }),
            ),
            http.get(`${API}/arquivo-erro`, () => erroApi(404, "SEM_AVALIACAO", "Execute uma simulação.")),
        );
        const arquivo = await apiDownload("/arquivo", "padrao.pdf");
        expect(arquivo.nomeArquivo).toBe("extrato.pdf");
        await expect(apiDownload("/arquivo-erro", "x.pdf")).rejects.toMatchObject({ codigo: "SEM_AVALIACAO", message: "Execute uma simulação." });
    });
});
