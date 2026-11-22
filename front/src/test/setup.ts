import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { servidor } from "./servidor";

// APIs do navegador ausentes no jsdom e usadas pelo react-aria e pelo ThemeProvider.
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (consulta: string) => ({
        matches: false,
        media: consulta,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
    }),
});
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
} as unknown as typeof ResizeObserver;

/** Navegação simulada: as telas chamam `useNavigate()`; os testes conferem os destinos. */
export const navegar = vi.fn();
export const parametros: { atual: Record<string, string> } = { atual: {} };

vi.mock("react-router", async (original) => ({
    ...(await original<typeof import("react-router")>()),
    useNavigate: () => navegar,
    useParams: () => parametros.atual,
}));

beforeAll(() => servidor.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
    servidor.resetHandlers();
    cleanup();
    vi.clearAllMocks();
});
afterAll(() => servidor.close());
