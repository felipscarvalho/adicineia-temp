import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { AMBIENTE_E2E } from "./e2e/ambiente";

/**
 * Teste ponta a ponta contra o backend real (back/dist) e o front compilado (next start).
 * Pré-requisitos: PostgreSQL 16 do docker-compose.hml.yml, `npm run build` em back/ e em front/.
 * CHROMIUM_PATH permite usar o Chromium já instalado no sistema.
 */
export default defineConfig({
    testDir: "./e2e",
    timeout: 90_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    reporter: [["list"], ["html", { open: "never" }]],
    use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        locale: "pt-BR",
        // Resolução mínima da RNF007.
        viewport: { width: 1366, height: 768 },
        trace: "retain-on-failure",
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    },
    webServer: [
        {
            // Prepara banco, contas e vocabulário e só então inicia a API compilada.
            command: `node ${path.join(__dirname, "e2e", "preparar_ambiente.mjs")} && node dist/main.js`,
            cwd: path.resolve(__dirname, "..", "back"),
            url: "http://localhost:3000/api/saude",
            reuseExistingServer: false,
            env: AMBIENTE_E2E.back,
            timeout: 60_000,
        },
        {
            command: "npm run start",
            cwd: __dirname,
            url: "http://localhost:3001/login",
            reuseExistingServer: false,
            timeout: 60_000,
        },
    ],
});
