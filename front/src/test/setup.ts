import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { Blob as BlobNode, File as FileNode } from "node:buffer";
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

// O interceptador do MSW monta um Request nativo do Node a partir do corpo do XMLHttpRequest; com o
// FormData/File do jsdom o multipart não é serializado. Os testes usam as implementações do Node.
const FormDataNode = (await new Response("", { headers: { "content-type": "application/x-www-form-urlencoded" } }).formData()).constructor as typeof FormData;
Object.assign(globalThis, { FormData: FormDataNode, File: FileNode, Blob: BlobNode });

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
