import { zodResolver } from "@hookform/resolvers/zod";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useEditForm } from "./use_edit_form";
import { useOpenSession } from "./use_open_session";

const esquema = z.object({ nome: z.string().min(1) });

describe("useEditForm", () => {
    it("carrega os dados salvos, marca alteração e descarta", async () => {
        const { result, rerender } = renderHook(({ salvos }) => useEditForm({ salvos, resolver: zodResolver(esquema) }), {
            initialProps: { salvos: { nome: "Base" } },
        });
        expect(result.current.getValues("nome")).toBe("Base");
        act(() => result.current.setValue("nome", "Outro", { shouldDirty: true }));
        expect(result.current.alterado).toBe(true);
        act(() => {
            result.current.discard();
        });
        expect(result.current.getValues("nome")).toBe("Base");
        rerender({ salvos: { nome: "Atualizado no servidor" } });
        expect(result.current.getValues("nome")).toBe("Atualizado no servidor");
    });
});

describe("useOpenSession", () => {
    it("incrementa a sessão a cada nova abertura", () => {
        const { result, rerender } = renderHook(({ aberto }) => useOpenSession(aberto), { initialProps: { aberto: false } });
        expect(result.current).toBe(0);
        rerender({ aberto: true });
        expect(result.current).toBe(1);
        rerender({ aberto: false });
        rerender({ aberto: true });
        expect(result.current).toBe(2);
    });
});
