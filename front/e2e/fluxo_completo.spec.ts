import { type Locator, type Page, expect, test } from "@playwright/test";
import path from "node:path";
import { CONTAS, RAIZ } from "./ambiente";

/*
 * Demonstração ponta a ponta pela interface (OBJ05; P1, seção 11), contra o backend real:
 * T00 → T01 → T02/T03 → T04 → T05 → T06 → T07 com os três perfis. Os números esperados vêm do
 * gabarito rotulado tests/fixtures/csv/atendimentos.gabarito.json.
 */

const CSV_ATENDIMENTOS = path.join(RAIZ, "tests", "fixtures", "csv", "atendimentos.csv");
const NOME_DATASET = "Atendimentos E2E";

async function entrar(page: Page, conta: { email: string; senha: string }) {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill(conta.email);
    await page.getByLabel("Senha").fill(conta.senha);
    await page.getByRole("button", { name: "Entrar" }).click();
}

async function sair(page: Page) {
    await page.getByRole("button", { name: "Sair" }).first().click();
    await expect(page).toHaveURL(/\/login$/);
}

async function escolher(page: Page, escopo: Page | Locator, rotulo: RegExp, opcao: RegExp) {
    await escopo.getByRole("button", { name: rotulo }).click();
    await page.getByRole("option", { name: opcao }).click();
}

async function criarRegra(page: Page, preencher: (dialogo: Locator) => Promise<void>) {
    await page.getByRole("button", { name: "Nova regra" }).click();
    const dialogo = page.getByRole("dialog", { name: "Nova regra" });
    await preencher(dialogo);
    await dialogo.getByRole("button", { name: "Criar regra" }).click();
    await expect(dialogo).toBeHidden();
}

test("fluxo completo do MVP pela interface com os três perfis", async ({ page }) => {
    // T00 + T01: analista entra, importa o CSV e confere a versão 1.
    await entrar(page, CONTAS.analista);
    await expect(page).toHaveURL(/\/datasets$/);
    await page.getByRole("button", { name: "Importar dataset" }).click();
    const importacao = page.getByRole("dialog", { name: "Importar dataset" });
    await importacao.getByLabel(/^Nome/).fill(NOME_DATASET);
    await escolher(page, importacao, /Separador/, /Ponto e vírgula/);
    await importacao.locator('input[type="file"]').setInputFiles(CSV_ATENDIMENTOS);
    await importacao.getByRole("button", { name: "Importar" }).click();
    await expect(importacao).toBeHidden();
    const linhaDataset = page.getByRole("row", { name: new RegExp(NOME_DATASET) });
    await expect(linhaDataset).toContainText("v1 de 1");
    await expect(linhaDataset).toContainText("24");

    // T03: três regras, uma de cada dimensão, com ações do catálogo.
    await page.getByRole("link", { name: "Regras" }).click();
    await criarRegra(page, async (dialogo) => {
        await dialogo.getByLabel(/Nome da regra/).fill("Sexo informado");
        await dialogo.getByRole("textbox", { name: /^Coluna 1/ }).fill("sexo");
        await dialogo.getByLabel(/Marcadores de ausência/).fill("ignorado");
        await escolher(page, dialogo, /Ação$/, /Preencher campo vazio/);
        await escolher(page, dialogo, /Coluna da ação/, /sexo/);
        await dialogo.getByLabel(/Valor literal/).fill("NAO_INFORMADO");
    });
    await criarRegra(page, async (dialogo) => {
        await dialogo.getByLabel(/Nome da regra/).fill("Atendimento sem repetição");
        await escolher(page, dialogo, /Dimensão/, /Unicidade/);
        await dialogo.getByRole("textbox", { name: /^Coluna 1/ }).fill("id_atendimento");
        await escolher(page, dialogo, /Ação$/, /Remover repetições/);
    });
    await criarRegra(page, async (dialogo) => {
        await dialogo.getByLabel(/Nome da regra/).fill("Idade entre 0 e 120");
        await escolher(page, dialogo, /Dimensão/, /Validade/);
        for (const [operador, valor] of [
            [/maior ou igual a/, "0"],
            [/menor ou igual a/, "120"],
        ] as const) {
            await dialogo.getByRole("button", { name: "Adicionar condição" }).click();
            const condicao = dialogo
                .locator("div.rounded-xl")
                .filter({ hasText: /^Condição/ })
                .last();
            await condicao.getByLabel("Coluna").fill("idade");
            await escolher(page, condicao, /Tipo/, /Número decimal/);
            await escolher(page, condicao, /Operador/, operador);
            await condicao.getByLabel(/^Valor/).fill(valor);
        }
    });
    await expect(page.getByRole("row")).toHaveCount(4);

    // T02: conjunto com as três regras e associação ao dataset.
    await page.getByRole("link", { name: "Conjuntos" }).click();
    await page.getByRole("button", { name: "Novo conjunto" }).click();
    const novoConjunto = page.getByRole("dialog", { name: "Novo conjunto de regras" });
    await novoConjunto.getByLabel(/^Nome/).fill("Conjunto E2E");
    for (const regra of [/Sexo informado/, /Atendimento sem repetição/, /Idade entre 0 e 120/]) {
        await escolher(page, novoConjunto, /Adicionar regra/, regra);
    }
    await novoConjunto.getByRole("button", { name: "Criar conjunto" }).click();
    await expect(novoConjunto).toBeHidden();
    await page.getByRole("link", { name: "Conjunto E2E" }).click();
    await escolher(page, page, /Associar a um dataset ativo/, new RegExp(NOME_DATASET));
    await page.getByRole("button", { name: "Associar", exact: true }).click();
    await expect(page.getByRole("link", { name: NOME_DATASET })).toBeVisible();

    // T04: simulação acompanhada até concluir, com as linhas do gabarito.
    await page.getByRole("link", { name: "Simulações" }).click();
    await escolher(page, page, /Dataset$/, new RegExp(NOME_DATASET));
    await escolher(page, page, /Versão$/, /^v1/);
    await escolher(page, page, /Conjunto de regras/, /Conjunto E2E/);
    await page.getByRole("button", { name: "Simular", exact: true }).click();
    await expect(page).toHaveURL(/\/simulacoes\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Violações por regra" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("row", { name: /Sexo informado/ })).toContainText("3, 8, 14");
    await expect(page.getByRole("row", { name: /Atendimento sem repetição/ })).toContainText("6, 16");
    await expect(page.getByRole("row", { name: /Idade entre 0 e 120/ })).toContainText("4, 9, 11");
    await expect(page.getByText("Conferido: original intacto")).toBeVisible();

    // T05: revisão e confirmação explícita do tratamento.
    await page.getByRole("button", { name: "Revisar e aplicar" }).click();
    const confirmacao = page.getByRole("dialog", { name: "Confirmar tratamento?" });
    await expect(confirmacao.getByRole("button", { name: "Aplicar tratamento" })).toBeDisabled();
    await confirmacao.getByText("Revisei as ações, a ordem e a prévia das alterações.").click();
    await confirmacao.getByRole("button", { name: "Aplicar tratamento" }).click();
    await expect(page.getByRole("heading", { name: "Tratamento confirmado" })).toBeVisible();
    await expect(page.getByText("v2", { exact: true })).toBeVisible();
    await expect(page.getByText("Simulação já aplicada")).toBeVisible();
    await sair(page);

    // T06: gestor consulta os três indicadores e exporta o XLSX.
    await entrar(page, CONTAS.gestor);
    await expect(page).toHaveURL(/\/diagnosticos$/);
    await expect(page.getByRole("link", { name: "Datasets" })).toHaveCount(0);
    await escolher(page, page, /Versão do dataset/, new RegExp(`${NOME_DATASET} · v1`));
    const indicadores = page.getByRole("region", { name: "Indicadores" });
    await expect(indicadores.getByRole("article", { name: "Unicidade" })).toContainText("91,67%");
    await expect(indicadores.getByRole("article", { name: "Completude" })).toContainText("87,50%");
    await expect(indicadores.getByRole("article", { name: "Validade" })).toContainText("87,50%");
    await expect(page.getByText(/3 de 3 dimensões · completa/)).toBeVisible();
    const [planilha] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar XLSX" }).click()]);
    expect(planilha.suggestedFilename()).toMatch(/^diagnostico-.+-v1\.xlsx$/);
    await page.goto("/datasets");
    await expect(page.getByText("Acesso não permitido")).toBeVisible();
    await sair(page);

    // T07: equipe técnica localiza o extrato do tratamento e exporta o PDF.
    await entrar(page, CONTAS.equipe);
    await expect(page).toHaveURL(/\/auditoria$/);
    await page.getByRole("button", { name: new RegExp(NOME_DATASET) }).click();
    await expect(page.getByRole("row").filter({ hasText: "v1 → v2" })).toBeVisible();
    await page.getByRole("link", { name: "Abrir extrato" }).click();
    await expect(page.getByText("Repetia a linha 2")).toBeVisible();
    await expect(page.getByText("Repetia a linha 1")).toBeVisible();
    const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar PDF" }).click()]);
    expect(pdf.suggestedFilename()).toMatch(/^extrato-auditoria-.+\.pdf$/);
    await sair(page);

    // Após o logout, a área logada volta para a autenticação.
    await page.goto("/auditoria");
    await expect(page).toHaveURL(/\/login$/);
});
