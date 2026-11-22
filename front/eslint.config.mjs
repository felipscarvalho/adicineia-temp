import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * Componentes do Untitled UI (copiados pelo CLI) ficam fora da análise: são congelados e seguem
 * as convenções da própria biblioteca.
 */
const config = [
    ...nextVitals,
    ...nextTypescript,
    {
        ignores: [
            ".next/**",
            "node_modules/**",
            "coverage/**",
            "playwright-report/**",
            "test-results/**",
            "next-env.d.ts",
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
];

export default config;
