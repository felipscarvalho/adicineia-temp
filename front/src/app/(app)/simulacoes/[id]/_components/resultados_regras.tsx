"use client";

import { useState } from "react";
import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { DimensaoBadge } from "@/components/rules/dimensao_badge";
import { ROTULO_ACAO } from "@/types/rules/regra";
import type { ResultadoRegra } from "@/types/simulations";

const LIMITE_EXIBIDO = 30;

function LinhasVioladas({ linhas }: { linhas: number[] }) {
    const [todas, setTodas] = useState(false);
    if (linhas.length === 0) {
        return <span className="text-success-primary">Nenhuma</span>;
    }
    const exibidas = todas ? linhas : linhas.slice(0, LIMITE_EXIBIDO);
    return (
        <span className="flex flex-col items-start gap-1">
            <span className="font-mono text-xs break-all">{exibidas.join(", ")}</span>
            {linhas.length > LIMITE_EXIBIDO && (
                <Button size="sm" color="link-color" onClick={() => setTodas(!todas)}>
                    {todas ? "Mostrar menos" : `Mostrar todas (${linhas.length})`}
                </Button>
            )}
        </span>
    );
}

/** IDs das linhas que violam cada regra, com totais (RF003, CA003). */
export function ResultadosRegras({ resultados }: { resultados: ResultadoRegra[] }) {
    return (
        <Table aria-label="Resultados por regra" size="sm">
            <Table.Header>
                <Table.Head id="regra" label="Regra" isRowHeader />
                <Table.Head id="violacoes" label="Violações" />
                <Table.Head id="aprovacao" label="Aprovação" />
                <Table.Head id="linhas" label="Linhas violadas" />
                <Table.Head id="acao" label="Ação prevista" />
            </Table.Header>
            <Table.Body items={resultados.map((r) => ({ ...r, id: r.regraId }))}>
                {(resultado) => (
                    <Table.Row id={resultado.regraId}>
                        <Table.Cell>
                            <span className="flex flex-col gap-1">
                                <span className="font-semibold text-primary">
                                    {resultado.ordem}. {resultado.nome}
                                </span>
                                <span className="flex items-center gap-2">
                                    <DimensaoBadge dimensao={resultado.dimensao} />
                                    <span className="text-xs text-tertiary">r{resultado.revisao}</span>
                                </span>
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            {resultado.totalViolacoes.toLocaleString("pt-BR")} de {resultado.totalAvaliados.toLocaleString("pt-BR")}
                        </Table.Cell>
                        <Table.Cell>{resultado.percentualAprovacao.toFixed(2)}%</Table.Cell>
                        <Table.Cell>
                            <LinhasVioladas linhas={resultado.linhasVioladas} />
                        </Table.Cell>
                        <Table.Cell>
                            {resultado.acao ? (
                                <Badge type="modern" size="sm">
                                    {ROTULO_ACAO[resultado.acao]} · {resultado.linhasPrevistas} linha(s)
                                </Badge>
                            ) : (
                                <span className="text-xs text-tertiary">Somente avaliação</span>
                            )}
                        </Table.Cell>
                    </Table.Row>
                )}
            </Table.Body>
        </Table>
    );
}
