import { useMemo, useState } from "react";
import { Plus } from "@untitledui/icons";
import { Table } from "@/components/application/table/table";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/layout/card";
import { ListContent } from "@/components/layout/list_content";
import { ListToolbar } from "@/components/layout/list_toolbar";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { descreverRegra } from "@/components/rules/descricao_regra";
import { DimensaoBadge } from "@/components/rules/dimensao_badge";
import { useRegras } from "@/hooks/rules/use_regras";
import { usePermissions } from "@/hooks/use_permissions";
import { formatDateTime } from "@/lib/moment";
import { NovaRegraModal } from "./nova_regra_modal";

function Regras() {
    const { can } = usePermissions();
    const consulta = useRegras();
    const [busca, setBusca] = useState("");
    const [criando, setCriando] = useState(false);
    const filtradas = useMemo(
        () => consulta.data?.filter((r) => r.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))),
        [consulta.data, busca],
    );

    return (
        <>
            <PageHeader
                titulo="Regras"
                descricao="Regras de unicidade, completude e validade, reutilizáveis em conjuntos. Cada edição gera uma revisão."
                acoes={
                    can("REGRA_MANTER") && (
                        <Button color="primary" iconLeading={Plus} onClick={() => setCriando(true)}>
                            Nova regra
                        </Button>
                    )
                }
            />
            <Card>
                <ListToolbar busca={busca} aoBuscar={setBusca} placeholder="Buscar por nome" />
                <ListContent
                    consulta={{ ...consulta, data: filtradas }}
                    vazio={{ titulo: "Nenhuma regra ativa", descricao: "Crie regras para montar os conjuntos de avaliação." }}
                >
                    {(itens) => (
                        <Table aria-label="Regras ativas" size="sm">
                            <Table.Header>
                                <Table.Head id="nome" label="Regra" isRowHeader />
                                <Table.Head id="dimensao" label="Dimensão" />
                                <Table.Head id="resumo" label="Configuração" />
                                <Table.Head id="revisao" label="Revisão" />
                                <Table.Head id="atualizada" label="Atualizada em" />
                            </Table.Header>
                            <Table.Body items={itens}>
                                {(regra) => (
                                    <Table.Row id={regra.id}>
                                        <Table.Cell>
                                            <Button color="link-color" size="sm" href={`/regras/${regra.id}`}>
                                                {regra.nome}
                                            </Button>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <DimensaoBadge dimensao={regra.dimensao} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="line-clamp-2 font-mono text-xs">{descreverRegra(regra.configuracao)}</span>
                                        </Table.Cell>
                                        <Table.Cell>r{regra.revisao}</Table.Cell>
                                        <Table.Cell>{formatDateTime(regra.atualizadoEm)}</Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    )}
                </ListContent>
            </Card>
            <NovaRegraModal isOpen={criando} aoFechar={() => setCriando(false)} />
        </>
    );
}

/** T02/T03 — Regras visuais do catálogo (RF002). */
export function RegrasTela() {
    return (
        <PermissionGate operacao="REGRA_CONSULTAR">
            <Regras />
        </PermissionGate>
    );
}
