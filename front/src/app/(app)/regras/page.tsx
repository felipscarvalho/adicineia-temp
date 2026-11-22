import type { Metadata } from "next";
import { RegrasTela } from "./_components/regras_tela";

export const instant = false;

export const metadata: Metadata = { title: "Regras" };

export default function PaginaRegras() {
    return <RegrasTela />;
}
