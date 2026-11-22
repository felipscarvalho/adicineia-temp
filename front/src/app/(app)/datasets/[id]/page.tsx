import type { Metadata } from "next";
import { DatasetDetalheTela } from "./_components/dataset_detalhe_tela";

export const instant = false;

export const metadata: Metadata = { title: "Dataset" };

export default function PaginaDataset() {
    return <DatasetDetalheTela />;
}
