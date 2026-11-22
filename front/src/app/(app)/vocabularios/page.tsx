import type { Metadata } from "next";
import { VocabulariosTela } from "./_components/vocabularios_tela";

export const instant = false;

export const metadata: Metadata = { title: "Vocabulários" };

export default function PaginaVocabularios() {
    return <VocabulariosTela />;
}
