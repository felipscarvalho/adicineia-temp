import type { Metadata } from "next";
import { DiagnosticoTela } from "./_components/diagnostico_tela";

export const instant = false;

export const metadata: Metadata = { title: "Diagnóstico de qualidade" };

export default function PaginaDiagnostico() {
    return <DiagnosticoTela />;
}
