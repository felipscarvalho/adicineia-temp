import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Componentes do Untitled UI (copiados pelo CLI) ficam fora da análise: são congelados e seguem
 * as convenções da própria biblioteca.
 */
export default tseslint.config(
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "playwright-report/**",
            "test-results/**",
            "src/components/base/**",
            "src/components/application/**",
            "src/components/foundations/**",
            "src/components/shared-assets/**",
            "src/components/marketing/**",
            "src/hooks/use-*.ts",
            "src/utils/**",
            "src/providers/**",
        ],
    },
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
        plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
        rules: {
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true, allowExportNames: ["toast", "criarQueryClient", "abreviarHash"] }],
        },
    },
);
