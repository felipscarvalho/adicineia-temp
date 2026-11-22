import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

/**
 * SPA servida em :3001. Em desenvolvimento e no `vite preview`, /api é encaminhado ao backend
 * (API_PROXY_URL), mantendo SPA e API no mesmo domínio como em produção (nginx).
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const proxy = { "/api": { target: env.API_PROXY_URL || "http://localhost:3000", changeOrigin: false } };
    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "./src"),
            },
        },
        server: { port: 3001, strictPort: true, proxy },
        preview: { port: 3001, strictPort: true, proxy },
    };
});
