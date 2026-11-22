import { StrictMode } from "react";
import { I18nProvider } from "react-aria-components";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "@/app";
import { Toaster } from "@/components/feedback/toast";
import { QueryProvider } from "@/components/query_provider";
import { RouteProvider } from "@/providers/router-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <I18nProvider locale="pt-BR">
                <BrowserRouter>
                    <RouteProvider>
                        <QueryProvider>
                            <App />
                            <Toaster />
                        </QueryProvider>
                    </RouteProvider>
                </BrowserRouter>
            </I18nProvider>
        </ThemeProvider>
    </StrictMode>,
);
