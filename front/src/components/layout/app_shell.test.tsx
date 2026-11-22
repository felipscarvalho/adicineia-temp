import { screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor } from "@/test/servidor";
import { navegacao } from "@/test/setup";
import { AppShell } from "./app_shell";

describe("AppShell — sessão (RF007, UC-08)", () => {
    it("revalida a sessão e mostra o conteúdo com o usuário na barra lateral", async () => {
        renderizar(
            <AppShell>
                <p>conteúdo protegido</p>
            </AppShell>,
            { sessao: null },
        );
        expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
        expect(screen.getAllByText("Ana Analista").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Analista de dados em saúde").length).toBeGreaterThan(0);
    });

    it("sem sessão válida, não mostra o conteúdo e volta para /login", async () => {
        servidor.use(http.get(`${API}/auth/sessao`, () => erroApi(401, "SESSAO_INVALIDA", "Sessão ausente ou encerrada.")));
        renderizar(
            <AppShell>
                <p>conteúdo protegido</p>
            </AppShell>,
            { sessao: null },
        );
        await waitFor(() => expect(navegacao.replace).toHaveBeenCalledWith("/login"));
        expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
    });
});
