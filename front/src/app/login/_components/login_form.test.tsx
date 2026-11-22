import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { useUserStore } from "@/stores/user_store";
import { renderizar } from "@/test/render";
import { API, erroApi, servidor, sessaoGestor } from "@/test/servidor";
import { navegacao } from "@/test/setup";
import { LoginForm } from "./login_form";

describe("LoginForm (T00, CT007)", () => {
    it("valida os campos antes de chamar a API", async () => {
        const { usuario } = renderizar(<LoginForm />, { sessao: null });
        await usuario.click(screen.getByRole("button", { name: "Entrar" }));
        expect(await screen.findByText("Informe o e-mail.")).toBeInTheDocument();
        expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    });

    it("entra, guarda usuário, permissões e CSRF e vai para a primeira tela do perfil", async () => {
        let corpo: unknown;
        servidor.use(
            http.post(`${API}/auth/entrar`, async ({ request }) => {
                corpo = await request.json();
                return HttpResponse.json(sessaoGestor);
            }),
        );
        const { usuario } = renderizar(<LoginForm />, { sessao: null });
        await usuario.type(screen.getByLabelText(/E-mail/), "gestor@teste.local");
        await usuario.type(screen.getByLabelText(/Senha/), "segredo-123");
        await usuario.click(screen.getByRole("button", { name: "Entrar" }));
        await waitFor(() => expect(navegacao.replace).toHaveBeenCalledWith("/diagnosticos"));
        expect(corpo).toEqual({ email: "gestor@teste.local", senha: "segredo-123" });
        expect(useUserStore.getState()).toMatchObject({ situacao: "autenticado", csrfToken: "csrf-gestor", usuario: { papel: "GESTOR" } });
    });

    it("mostra a mensagem genérica de credenciais inválidas e limpa a senha", async () => {
        servidor.use(http.post(`${API}/auth/entrar`, () => erroApi(401, "CREDENCIAIS_INVALIDAS", "Credenciais inválidas.")));
        const { usuario } = renderizar(<LoginForm />, { sessao: null });
        await usuario.type(screen.getByLabelText(/E-mail/), "ana@teste.local");
        await usuario.type(screen.getByLabelText(/Senha/), "errada");
        await usuario.click(screen.getByRole("button", { name: "Entrar" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Credenciais inválidas.");
        expect(screen.getByLabelText(/Senha/)).toHaveValue("");
        expect(navegacao.replace).not.toHaveBeenCalled();
    });
});
