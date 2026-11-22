import type { Metadata } from "next";
import { SimulacoesTela } from "./_components/simulacoes_tela";

export const instant = false;

export const metadata: Metadata = { title: "Simulações" };

export default function PaginaSimulacoes() {
    return <SimulacoesTela />;
}
