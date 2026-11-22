import type { Metadata } from "next";
import { AuditoriaTela } from "./_components/auditoria_tela";

export const instant = false;

export const metadata: Metadata = { title: "Auditoria" };

export default function PaginaAuditoria() {
    return <AuditoriaTela />;
}
