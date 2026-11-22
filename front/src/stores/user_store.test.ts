import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { apiPost } from "@/lib/api";
import { API, erroApi, servidor, sessaoAnalista } from "@/test/servidor";
import { useUserStore } from "./user_store";

describe("user_store (RF007)", () => {
    beforeEach(() => useUserStore.setState({ usuario: null, permissoes: [], csrfToken: null, situacao: "verificando" }));

    it("revalida a sessão do cookie e expõe can/canAnywhere", async () => {
        await expect(useUserStore.getState().revalidate()).resolves.toBe(true);
        const estado = useUserStore.getState();
        expect(estado.usuario?.email).toBe(sessaoAnalista.usuario.email);
        expect(estado.can("TRATAMENTO_APLICAR")).toBe(true);
        useUserStore.setState({ permissoes: ["AUDITORIA_CONSULTAR"] });
        expect(useUserStore.getState().can("TRATAMENTO_APLICAR")).toBe(false);
        expect(useUserStore.getState().canAnywhere(["DATASET_LISTAR", "AUDITORIA_CONSULTAR"])).toBe(true);
        expect(useUserStore.getState().canAnywhere(["DATASET_LISTAR"])).toBe(false);
    });

    it("trata sessão ausente ou encerrada como anônima", async () => {
        servidor.use(http.get(`${API}/auth/sessao`, () => erroApi(401, "SESSAO_INVALIDA", "Sessão ausente ou encerrada.")));
        await expect(useUserStore.getState().revalidate()).resolves.toBe(false);
        expect(useUserStore.getState()).toMatchObject({ situacao: "anonimo", usuario: null, csrfToken: null });
    });

    it("encerra a sessão no servidor e limpa o estado no logout", async () => {
        let chamou = false;
        servidor.use(
            http.post(`${API}/auth/sair`, () => {
                chamou = true;
                return new HttpResponse(null, { status: 204 });
            }),
        );
        await useUserStore.getState().revalidate();
        await useUserStore.getState().logout();
        expect(chamou).toBe(true);
        expect(useUserStore.getState().situacao).toBe("anonimo");
    });

    it("limpa a sessão quando qualquer rota protegida responde 401", async () => {
        await useUserStore.getState().revalidate();
        servidor.use(http.post(`${API}/datasets`, () => erroApi(401, "SESSAO_INVALIDA", "Sessão ausente ou encerrada.")));
        await expect(apiPost("/datasets", {})).rejects.toMatchObject({ status: 401 });
        expect(useUserStore.getState().situacao).toBe("anonimo");
    });
});
