"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/navigation";
import { I18nProvider, RouterProvider } from "react-aria-components";
import { Toaster } from "@/components/feedback/toast";
import { QueryProvider } from "@/components/query_provider";

declare module "react-aria-components" {
    interface RouterConfig {
        routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;
    }
}

/** Provedores globais: tema (padrão escuro), locale pt-BR do react-aria, roteador, cache e toasts. */
export function Providers({ children }: { children: ReactNode }) {
    const router = useRouter();
    return (
        <ThemeProvider attribute="class" value={{ light: "light-mode", dark: "dark-mode" }} defaultTheme="dark" enableSystem={false}>
            <I18nProvider locale="pt-BR">
                <RouterProvider navigate={router.push}>
                    <QueryProvider>
                        {children}
                        <Toaster />
                    </QueryProvider>
                </RouterProvider>
            </I18nProvider>
        </ThemeProvider>
    );
}
