import { screen, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { vocabularioCid10 } from "@/test/fixtures";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoGestor } from "@/test/servidor";
import { VocabulariosTela } from "./vocabularios_tela";

describe("VocabulariosTela (RN02, ADR-009)", () => {
    it("lista vocabulário com origem, versão, licença e quantidade de códigos", async () => {
        servidor.use(http.get(`${API}/vocabularios`, () => HttpResponse.json([vocabularioCid10])));
        renderizar(<VocabulariosTela />);
        const linha = (await screen.findByText("CID-10")).closest("tr")!;
        expect(within(linha).getByText("amostra-teste-1")).toBeInTheDocument();
        expect(within(linha).getByText("Uso restrito aos testes acadêmicos")).toBeInTheDocument();
        expect(within(linha).getByText("25")).toBeInTheDocument();
        expect(screen.getByText(/Somente a CID-10 integra a baseline/)).toBeInTheDocument();
    });

    it("informa que regras de vocabulário ficam bloqueadas sem importação", async () => {
        servidor.use(http.get(`${API}/vocabularios`, () => HttpResponse.json([])));
        renderizar(<VocabulariosTela />);
        expect(await screen.findByText("Nenhum vocabulário disponível")).toBeInTheDocument();
    });

    it("mostra erro do servidor com opção de tentar novamente", async () => {
        servidor.use(http.get(`${API}/vocabularios`, () => erroApi(500, "Erro interno", "Não foi possível concluir a operação.")));
        renderizar(<VocabulariosTela />);
        expect(await screen.findByText("Não foi possível concluir a operação.")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    });

    it("não abre para perfis sem RF002", () => {
        renderizar(<VocabulariosTela />, { sessao: sessaoGestor });
        expect(screen.getByText("Acesso não permitido")).toBeInTheDocument();
    });
});
