import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { AppShell } from "@/components/layout/app_shell";
import { LoadingState } from "@/components/layout/states";
import { TituloPagina } from "@/components/layout/titulo_pagina";
import { InicioPagina } from "@/pages/inicio_pagina";
import { LoginPagina } from "@/pages/login/login_pagina";
import { NaoEncontradaPagina } from "@/pages/nao_encontrada_pagina";

// Telas da área logada carregadas sob demanda (um pacote por rota).
const DatasetsTela = lazy(() => import("@/pages/datasets/_components/datasets_tela").then((modulo) => ({ default: modulo.DatasetsTela })));

/** Rotas da SPA: T00 pública e T01–T07 dentro da área logada (`AppShell`). */
export function App() {
    return (
        <Suspense fallback={<LoadingState rotulo="Carregando..." />}>
            <Routes>
                <Route path="/" element={<InicioPagina />} />
                <Route
                    path="/login"
                    element={
                        <TituloPagina titulo="Entrar">
                            <LoginPagina />
                        </TituloPagina>
                    }
                />
                <Route element={<AppShell />}>
                    <Route
                        path="/datasets"
                        element={
                            <TituloPagina titulo="Datasets">
                                <DatasetsTela />
                            </TituloPagina>
                        }
                    />
                </Route>
                <Route
                    path="*"
                    element={
                        <TituloPagina titulo="Página não encontrada">
                            <NaoEncontradaPagina />
                        </TituloPagina>
                    }
                />
            </Routes>
        </Suspense>
    );
}
