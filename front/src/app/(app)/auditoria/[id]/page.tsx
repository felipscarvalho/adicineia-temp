import type { Metadata } from "next";
import { ExtratoTela } from "./_components/extrato_tela";

export const instant = false;

export const metadata: Metadata = { title: "Extrato de auditoria" };

export default function PaginaExtrato() {
    return <ExtratoTela />;
}
