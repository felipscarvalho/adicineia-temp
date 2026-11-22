import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { servidor } from "./servidor";

// APIs do navegador ausentes no jsdom e usadas pelo react-aria e pelo next-themes.
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

export const navegacao = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() };
export const parametros: { atual: Record<string, string> } = { atual: {} };

vi.mock("next/navigation", () => ({
    useRouter: () => navegacao,
    usePathname: () => "/",
    useParams: () => parametros.atual,
    useSearchParams: () => new URLSearchParams(),
}));

beforeAll(() => servidor.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
    servidor.resetHandlers();
    cleanup();
    vi.clearAllMocks();
});
afterAll(() => servidor.close());
