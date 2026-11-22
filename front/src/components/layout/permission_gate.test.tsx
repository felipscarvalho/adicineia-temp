import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { apiGet, apiPost } from "@/lib/api";
import { renderizar } from "@/test/render";
import { API, servidor, sessaoGestor } from "@/test/servidor";
import { PermissionGate } from "./permission_gate";

describe("PermissionGate e CSRF (RNF003, ADR-006)", () => {
    it("bloqueia a tela para perfil sem a operação", () => {
        renderizar(
            <PermissionGate operacao="DATASET_LISTAR">
                <p>lista de datasets</p>
            </PermissionGate>,
            { sessao: sessaoGestor },
        );
        expect(screen.getByText("Acesso não permitido")).toBeInTheDocument();
        expect(screen.queryByText("lista de datasets")).not.toBeInTheDocument();
    });

    it("libera a tela para perfil com a operação", () => {
        renderizar(
            <PermissionGate operacao="DIAGNOSTICO_CONSULTAR">
                <p>painel</p>
            </PermissionGate>,
            { sessao: sessaoGestor },
        );
        expect(screen.getByText("painel")).toBeInTheDocument();
    });

    it("envia o token CSRF da sessão só nos métodos que alteram estado", async () => {
        const cabecalhos: Record<string, string | null> = {};
        servidor.use(
            http.get(`${API}/eco`, ({ request }) => {
                cabecalhos.get = request.headers.get("x-csrf-token");
                return HttpResponse.json({});
            }),
            http.post(`${API}/eco`, ({ request }) => {
                cabecalhos.post = request.headers.get("x-csrf-token");
                return HttpResponse.json({});
            }),
        );
        renderizar(<p />, { sessao: sessaoGestor });
        await apiGet("/eco");
        await apiPost("/eco", {});
        expect(cabecalhos).toEqual({ get: null, post: "csrf-gestor" });
    });

    it("repassa a recusa 403 do servidor como erro normalizado", async () => {
        servidor.use(
            http.post(`${API}/tratamentos`, () =>
                HttpResponse.json({ statusCode: 403, erro: "OPERACAO_NAO_PERMITIDA", mensagem: "Operação não permitida para o seu perfil." }, { status: 403 }),
            ),
        );
        renderizar(<p />, { sessao: sessaoGestor });
        await expect(apiPost("/tratamentos", {})).rejects.toMatchObject({ status: 403, codigo: "OPERACAO_NAO_PERMITIDA" });
    });
});
