// Recria o banco do ensaio e prepara os dados como a equipe faria: migrações, contas de
// demonstração e vocabulário (amostra sintética de CID-10, nunca o arquivo oficial).
// Executado pelo webServer do backend antes de iniciar a API, com o ambiente definido em
// e2e/ambiente.ts (ver playwright.config.ts).
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BACK = path.join(RAIZ, "back");
const urlAdmin = new URL(process.env.DATABASE_URL);
urlAdmin.pathname = "/postgres";

function executar(argumentos) {
    execFileSync(process.execPath, argumentos, { cwd: BACK, env: process.env, stdio: "inherit" });
}

const recriarBanco = `
    const { Client } = require("pg");
    (async () => {
        const cliente = new Client({ connectionString: ${JSON.stringify(urlAdmin.toString())} });
        await cliente.connect();
        await cliente.query("DROP DATABASE IF EXISTS dataqualisus_e2e WITH (FORCE)");
        await cliente.query("CREATE DATABASE dataqualisus_e2e");
        await cliente.end();
    })().catch((erro) => { console.error(erro.message); process.exit(1); });`;

executar(["-e", recriarBanco]);
rmSync(process.env.ARMAZENAMENTO_DIR, { recursive: true, force: true });
executar(["dist/cli/migrar.js"]);
executar(["dist/cli/seed-contas-demo.js"]);
executar([
    "dist/cli/importar-vocabulario.js",
    `--arquivo=${path.join(RAIZ, "tests", "fixtures", "vocabularios", "cid10-amostra-teste.csv")}`,
    "--nome=CID-10",
    "--origem=Amostra sintética de teste (não oficial)",
    "--versao=amostra-e2e",
    "--licenca=Uso restrito aos testes acadêmicos",
]);
