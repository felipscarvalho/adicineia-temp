import { useMemo, useState } from "react";
import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Card } from "@/components/layout/card";
import { ListContent } from "@/components/layout/list_content";
import { ListToolbar } from "@/components/layout/list_toolbar";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { useDatasets } from "@/hooks/datasets/use_datasets";
import { usePermissions } from "@/hooks/use_permissions";
import { ImportarDatasetModal } from "./importar_dataset_modal";
import { TabelaDatasets } from "./tabela_datasets";

function Datasets() {
    const { can } = usePermissions();
    const consulta = useDatasets();
    const [busca, setBusca] = useState("");
    const [importando, setImportando] = useState(false);
    const filtrados = useMemo(
        () => consulta.data?.filter((d) => d.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))),
        [consulta.data, busca],
    );

    return (
        <>
            <PageHeader
                titulo="Datasets"
                descricao="Bases CSV avaliadas, com versões imutáveis identificadas pelo SHA-256."
                acoes={
                    can("DATASET_IMPORTAR") && (
                        <Button color="primary" iconLeading={Plus} onClick={() => setImportando(true)}>
                            Importar dataset
                        </Button>
                    )
                }
            />
            <Card>
                <ListToolbar busca={busca} aoBuscar={setBusca} placeholder="Buscar por nome" />
                <ListContent
                    consulta={{ ...consulta, data: filtrados }}
                    vazio={{ titulo: "Nenhum dataset ativo", descricao: "Importe um arquivo CSV para começar." }}
                >
                    {(itens) => <TabelaDatasets datasets={itens} />}
                </ListContent>
            </Card>
            <ImportarDatasetModal isOpen={importando} aoFechar={() => setImportando(false)} />
        </>
    );
}

/** T01 — Manutenção de datasets: listagem ativa e importação (RF001, UC-01). */
export function DatasetsTela() {
    return (
        <PermissionGate operacao="DATASET_LISTAR">
            <Datasets />
        </PermissionGate>
    );
}
