import type { Metadata } from "next";
import { RegraDetalheTela } from "./_components/regra_detalhe_tela";

export const instant = false;

export const metadata: Metadata = { title: "Regra" };

export default function PaginaRegra() {
    return <RegraDetalheTela />;
}
