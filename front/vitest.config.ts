import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { "@": path.resolve(__dirname, "src") } },
    test: {
        environment: "jsdom",
        environmentOptions: { jsdom: { url: "http://localhost:3000" } },
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
        css: false,
        testTimeout: 15000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/components/base/**",
                "src/components/application/**",
                "src/components/foundations/**",
                "src/components/shared-assets/**",
                "src/components/marketing/**",
                "src/test/**",
                "src/**/*.test.{ts,tsx}",
            ],
        },
    },
});
