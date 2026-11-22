"use client";

import { useState } from "react";
import { LinkBroken01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import { toast } from "@/components/feedback/toast";
import { useDatasets } from "@/hooks/datasets/use_datasets";
import { useAssociarDataset, useDesassociarDataset } from "@/hooks/rules/use_conjuntos";
import type { Conjunto } from "@/types/rules/regra";

/** Associação do conjunto aos datasets: o servidor recusa colunas inexistentes na versão atual. */
export function DatasetsAssociados({ conjunto, editavel }: { conjunto: Conjunto; editavel: boolean }) {
    const datasets = useDatasets();
    const associar = useAssociarDataset(conjunto.id);
    const desassociar = useDesassociarDataset(conjunto.id);
    const [escolhido, setEscolhido] = useState<string | null>(null);
    const nomes = new Map((datasets.data ?? []).map((d) => [d.id, d.nome]));
    const disponiveis = (datasets.data ?? []).filter((d) => !conjunto.datasets.includes(d.id));

    return (
        <div className="flex flex-col gap-3">
            {conjunto.datasets.length === 0 && <p className="text-sm text-tertiary">O conjunto ainda não está associado a nenhum dataset.</p>}
            <ul className="flex flex-col gap-2">
                {conjunto.datasets.map((id) => (
                    <li key={id} className="flex items-center justify-between rounded-xl p-3 ring-1 ring-secondary">
                        <Button color="link-color" size="sm" href={`/datasets/${id}`}>
                            {nomes.get(id) ?? "Dataset excluído logicamente"}
                        </Button>
                        {editavel && (
                            <ButtonUtility
                                size="xs"
                                color="tertiary"
                                icon={LinkBroken01}
                                tooltip="Desassociar"
                                onClick={() => desassociar.mutate(id, { onSuccess: () => toast.success("Associação removida") })}
                            />
                        )}
                    </li>
                ))}
            </ul>
            {editavel && disponiveis.length > 0 && (
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                    <Select
                        label="Associar a um dataset ativo"
                        placeholder="Selecione o dataset"
                        size="sm"
                        className="md:w-96"
                        items={disponiveis.map((d) => ({ id: d.id, label: d.nome, supportingText: `v${d.versaoAtual?.numero ?? "—"}` }))}
                        selectedKey={escolhido}
                        onSelectionChange={(chave) => setEscolhido(chave ? String(chave) : null)}
                    >
                        {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                    <Button
                        size="sm"
                        color="secondary"
                        className="glass-control"
                        isDisabled={!escolhido}
                        isLoading={associar.isPending}
                        onClick={() =>
                            escolhido &&
                            associar.mutate(escolhido, {
                                onSuccess: () => {
                                    toast.success("Conjunto associado ao dataset");
                                    setEscolhido(null);
                                },
                            })
                        }
                    >
                        Associar
                    </Button>
                </div>
            )}
        </div>
    );
}
