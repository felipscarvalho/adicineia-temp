import { screen, waitFor } from "@testing-library/react";
import { http } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor } from "@/test/servidor";
import { navegar } from "@/test/setup";
import { AppShell } from "./app_shell";

describe("AppShell — sessão (RF007, UC-08)", () => {
    it("revalida a sessão e mostra o conteúdo com o usuário na barra lateral", async () => {
        renderizar(
            <Routes>
                <Route element={<AppShell />}>
                    <Route path="/" element={<p>conteúdo protegido</p>} />
                </Route>
            </Routes>,
            { sessao: null },
        );
        expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
        expect(screen.getAllByText("Ana Analista").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Analista de dados em saúde").length).toBeGreaterThan(0);
    });

    it("sem sessão válida, não mostra o conteúdo e volta para /login", async () => {
        servidor.use(http.get(`${API}/auth/sessao`, () => erroApi(401, "SESSAO_INVALIDA", "Sessão ausente ou encerrada.")));
        renderizar(
            <Routes>
                <Route element={<AppShell />}>
                    <Route path="/" element={<p>conteúdo protegido</p>} />
                </Route>
            </Routes>,
            { sessao: null },
        );
        await waitFor(() => expect(navegar).toHaveBeenCalledWith("/login", { replace: true }));
        expect(screen.queryByText("conteúdo protegido")).not.toBeInTheDocument();
    });
});
