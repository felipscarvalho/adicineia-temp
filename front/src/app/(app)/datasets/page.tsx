import type { Metadata } from "next";
import { DatasetsTela } from "./_components/datasets_tela";

export const instant = false;

export const metadata: Metadata = { title: "Datasets" };

export default function PaginaDatasets() {
    return <DatasetsTela />;
}
