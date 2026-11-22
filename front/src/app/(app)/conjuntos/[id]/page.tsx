import type { Metadata } from "next";
import { ConjuntoDetalheTela } from "./_components/conjunto_detalhe_tela";

export const instant = false;

export const metadata: Metadata = { title: "Conjunto de regras" };

export default function PaginaConjunto() {
    return <ConjuntoDetalheTela />;
}
