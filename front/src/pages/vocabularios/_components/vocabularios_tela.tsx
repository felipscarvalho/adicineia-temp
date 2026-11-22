import { Table } from "@/components/application/table/table";
import { Badge } from "@/components/base/badges/badges";
import { abreviarHash } from "@/components/datasets/situacao_badge";
import { Alert } from "@/components/feedback/alert";
import { Card } from "@/components/layout/card";
import { ListContent } from "@/components/layout/list_content";
import { PageHeader } from "@/components/layout/page_header";
import { PermissionGate } from "@/components/layout/permission_gate";
import { useVocabularios } from "@/hooks/rules/use_vocabularios";
import { formatDateTime } from "@/lib/moment";

function Vocabularios() {
    const consulta = useVocabularios();
    return (
        <>
            <PageHeader titulo="Vocabulários oficiais" descricao="Listas versionadas usadas pelas regras de validade de códigos clínicos (RN02)." />
            <Alert variante="info" titulo="Importação feita pela equipe de desenvolvimento">
                Os vocabulários entram por script, com origem, versão, licença e hash do arquivo (ADR-009). Somente a CID-10 integra a baseline; trocar de
                versão exige nova importação e revisão das regras que a usam.
            </Alert>
            <Card>
                <ListContent
                    consulta={consulta}
                    vazio={{ titulo: "Nenhum vocabulário disponível", descricao: "Regras que dependem de vocabulário ficam bloqueadas até a importação." }}
                >
                    {(itens) => (
                        <Table aria-label="Vocabulários disponíveis" size="sm">
                            <Table.Header>
                                <Table.Head id="nome" label="Vocabulário" isRowHeader />
                                <Table.Head id="origem" label="Origem" />
                                <Table.Head id="licenca" label="Licença" />
                                <Table.Head id="codigos" label="Códigos" />
                                <Table.Head id="hash" label="SHA-256 do arquivo" />
                                <Table.Head id="importado" label="Importado em" />
                            </Table.Header>
                            <Table.Body items={itens}>
                                {(vocabulario) => (
                                    <Table.Row id={vocabulario.id}>
                                        <Table.Cell>
                                            <span className="flex items-center gap-2 font-semibold text-primary">
                                                {vocabulario.nome}
                                                <Badge type="modern" size="sm">
                                                    {vocabulario.versao}
                                                </Badge>
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>{vocabulario.origem}</Table.Cell>
                                        <Table.Cell>{vocabulario.licenca}</Table.Cell>
                                        <Table.Cell>{vocabulario.totalCodigos.toLocaleString("pt-BR")}</Table.Cell>
                                        <Table.Cell>
                                            <span className="font-mono text-xs" title={vocabulario.hashArquivo}>
                                                {abreviarHash(vocabulario.hashArquivo)}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>{formatDateTime(vocabulario.importadoEm)}</Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    )}
                </ListContent>
            </Card>
        </>
    );
}

/** Consulta de vocabulários disponíveis para a configuração de regras (T03, RN02, ADR-009). */
export function VocabulariosTela() {
    return (
        <PermissionGate operacao="VOCABULARIO_CONSULTAR">
            <Vocabularios />
        </PermissionGate>
    );
}
