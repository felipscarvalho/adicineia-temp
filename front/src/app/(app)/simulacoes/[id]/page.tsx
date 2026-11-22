import type { Metadata } from "next";
import { SimulacaoDetalheTela } from "./_components/simulacao_detalhe_tela";

export const instant = false;

export const metadata: Metadata = { title: "Simulação" };

export default function PaginaSimulacao() {
    return <SimulacaoDetalheTela />;
}
