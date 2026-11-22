import type { Metadata } from "next";
import { ConjuntosTela } from "./_components/conjuntos_tela";

export const instant = false;

export const metadata: Metadata = { title: "Conjuntos de regras" };

export default function PaginaConjuntos() {
    return <ConjuntosTela />;
}
