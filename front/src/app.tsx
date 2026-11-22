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
const DatasetDetalheTela = lazy(() =>
    import("@/pages/datasets/detalhe/_components/dataset_detalhe_tela").then((modulo) => ({ default: modulo.DatasetDetalheTela })),
);
const VocabulariosTela = lazy(() => import("@/pages/vocabularios/_components/vocabularios_tela").then((modulo) => ({ default: modulo.VocabulariosTela })));
const RegrasTela = lazy(() => import("@/pages/regras/_components/regras_tela").then((modulo) => ({ default: modulo.RegrasTela })));
const RegraDetalheTela = lazy(() => import("@/pages/regras/detalhe/_components/regra_detalhe_tela").then((modulo) => ({ default: modulo.RegraDetalheTela })));
const ConjuntosTela = lazy(() => import("@/pages/conjuntos/_components/conjuntos_tela").then((modulo) => ({ default: modulo.ConjuntosTela })));
const ConjuntoDetalheTela = lazy(() =>
    import("@/pages/conjuntos/detalhe/_components/conjunto_detalhe_tela").then((modulo) => ({ default: modulo.ConjuntoDetalheTela })),
);
const SimulacoesTela = lazy(() => import("@/pages/simulacoes/_components/simulacoes_tela").then((modulo) => ({ default: modulo.SimulacoesTela })));
const SimulacaoDetalheTela = lazy(() =>
    import("@/pages/simulacoes/detalhe/_components/simulacao_detalhe_tela").then((modulo) => ({ default: modulo.SimulacaoDetalheTela })),
);
const DiagnosticoTela = lazy(() => import("@/pages/diagnosticos/_components/diagnostico_tela").then((modulo) => ({ default: modulo.DiagnosticoTela })));
const AuditoriaTela = lazy(() => import("@/pages/auditoria/_components/auditoria_tela").then((modulo) => ({ default: modulo.AuditoriaTela })));
const ExtratoTela = lazy(() => import("@/pages/auditoria/detalhe/_components/extrato_tela").then((modulo) => ({ default: modulo.ExtratoTela })));

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
                    <Route
                        path="/datasets/:id"
                        element={
                            <TituloPagina titulo="Dataset">
                                <DatasetDetalheTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/vocabularios"
                        element={
                            <TituloPagina titulo="Vocabulários">
                                <VocabulariosTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/regras"
                        element={
                            <TituloPagina titulo="Regras">
                                <RegrasTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/regras/:id"
                        element={
                            <TituloPagina titulo="Regra">
                                <RegraDetalheTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/conjuntos"
                        element={
                            <TituloPagina titulo="Conjuntos de regras">
                                <ConjuntosTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/conjuntos/:id"
                        element={
                            <TituloPagina titulo="Conjunto de regras">
                                <ConjuntoDetalheTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/simulacoes"
                        element={
                            <TituloPagina titulo="Simulações">
                                <SimulacoesTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/simulacoes/:id"
                        element={
                            <TituloPagina titulo="Simulação">
                                <SimulacaoDetalheTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/diagnosticos"
                        element={
                            <TituloPagina titulo="Diagnóstico de qualidade">
                                <DiagnosticoTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/auditoria"
                        element={
                            <TituloPagina titulo="Auditoria">
                                <AuditoriaTela />
                            </TituloPagina>
                        }
                    />
                    <Route
                        path="/auditoria/:id"
                        element={
                            <TituloPagina titulo="Extrato de auditoria">
                                <ExtratoTela />
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
