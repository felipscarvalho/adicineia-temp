"use client";

import { useState } from "react";
import { Table } from "@/components/application/table/table";
import { ListPagination } from "@/components/layout/list_pagination";
import { ErrorState, LoadingState } from "@/components/layout/states";
import { useRegistros } from "@/hooks/datasets/use_datasets";
import type { ApiError } from "@/lib/api";

/** Consulta paginada dos registros de uma versão; valores exibidos como texto (RNF005). */
export function RegistrosVersao({ datasetId, versaoId }: { datasetId: string; versaoId: string }) {
    const [pagina, setPagina] = useState(1);
    const consulta = useRegistros(datasetId, versaoId, pagina);

    if (consulta.isPending) {
        return <LoadingState rotulo="Lendo registros..." />;
    }
    if (consulta.isError) {
        return <ErrorState mensagem={(consulta.error as ApiError).message} aoTentarNovamente={() => consulta.refetch()} />;
    }
    const { itens, metadata, colunas } = consulta.data;
    const colunasTabela = [{ id: "__linha", nome: "Linha" }, ...colunas.map((nome) => ({ id: nome, nome }))];

    return (
        <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-xl ring-1 ring-secondary">
                <Table aria-label="Registros da versão" size="sm">
                    <Table.Header columns={colunasTabela}>
                        {(coluna) => <Table.Head id={coluna.id} label={coluna.nome} isRowHeader={coluna.id === "__linha"} />}
                    </Table.Header>
                    <Table.Body items={itens.map((registro) => ({ id: registro.linha, ...registro }))}>
                        {(registro) => (
                            <Table.Row id={registro.linha} columns={colunasTabela}>
                                {(coluna) => (
                                    <Table.Cell className="font-mono text-xs whitespace-pre">
                                        {coluna.id === "__linha" ? registro.linha : (registro.valores[coluna.id] ?? "")}
                                    </Table.Cell>
                                )}
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </div>
            <ListPagination pagina={metadata.pagina} totalPaginas={metadata.totalPaginas} total={metadata.total} aoMudar={setPagina} />
        </div>
    );
}
