// Parâmetros do ensaio ponta a ponta, compartilhados pelo Playwright e pela preparação do banco.
import { tmpdir } from "node:os";
import path from "node:path";

const URL_ADMIN = process.env.E2E_DATABASE_ADMIN_URL ?? "postgres://dataqualisus:dataqualisus_dev@localhost:55432/postgres";
const urlBanco = new URL(URL_ADMIN);
urlBanco.pathname = "/dataqualisus_e2e";

/** Contas de demonstração do ensaio (senhas apenas de teste). */
export const CONTAS = {
    analista: { email: "analista@dataqualisus.local", senha: "analista-e2e-123" },
    gestor: { email: "gestor@dataqualisus.local", senha: "gestor-e2e-123" },
    equipe: { email: "equipe.tecnica@dataqualisus.local", senha: "equipe-e2e-123" },
};

export const RAIZ = path.resolve(__dirname, "..", "..");

export const AMBIENTE_E2E = {
    urlAdmin: URL_ADMIN,
    urlBanco: urlBanco.toString(),
    back: {
        PORTA: "3000",
        NODE_ENV: "production",
        DATABASE_URL: urlBanco.toString(),
        DATABASE_URL_MIGRACAO: urlBanco.toString(),
        ARMAZENAMENTO_DIR: path.join(tmpdir(), "dataqualisus-e2e-armazenamento"),
        BCRYPT_CUSTO: "4",
        SIMULACAO_LIMITE_MS: "60000",
        SIMULACAO_POOL_TAMANHO: "2",
        SEED_SENHA_ANALISTA: CONTAS.analista.senha,
        SEED_SENHA_GESTOR: CONTAS.gestor.senha,
        SEED_SENHA_EQUIPE_TECNICA: CONTAS.equipe.senha,
    } as Record<string, string>,
};
