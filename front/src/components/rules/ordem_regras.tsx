"use client";

import { ArrowDown, ArrowUp, Trash01 } from "@untitledui/icons";
import { type Control, useController } from "react-hook-form";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Select } from "@/components/base/select/select";
import type { ConjuntoForm } from "@/schemas/rules/conjunto";
import type { Regra } from "@/types/rules/regra";
import { descreverRegra } from "./descricao_regra";
import { DimensaoBadge } from "./dimensao_badge";

/** Lista ordenada das regras do conjunto: a ordem exibida é a ordem de execução das ações. */
export function OrdemRegras({ control, regras, somenteLeitura = false }: { control: Control<ConjuntoForm>; regras: Regra[]; somenteLeitura?: boolean }) {
    const {
        field: { value, onChange },
        fieldState,
    } = useController({ control, name: "regras" });
    const ids = value ?? [];
    const porId = new Map(regras.map((r) => [r.id, r]));
    const disponiveis = regras.filter((r) => !ids.includes(r.id));

    const mover = (indice: number, delta: number) => {
        const novos = [...ids];
        const [item] = novos.splice(indice, 1);
        novos.splice(indice + delta, 0, item);
        onChange(novos);
    };

    return (
        <div className="flex flex-col gap-3">
            {ids.length === 0 && <p className="text-sm text-tertiary">Nenhuma regra no conjunto.</p>}
            <ol className="flex flex-col gap-2">
                {ids.map((id, indice) => {
                    const regra = porId.get(id);
                    return (
                        <li key={id} className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary">
                            <span className="w-6 text-center font-mono text-sm text-quaternary">{indice + 1}</span>
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    {regra?.nome ?? "Regra indisponível"}
                                    {regra && <DimensaoBadge dimensao={regra.dimensao} />}
                                </span>
                                {regra && <span className="truncate font-mono text-xs text-tertiary">{descreverRegra(regra.configuracao)}</span>}
                            </div>
                            {!somenteLeitura && (
                                <div className="flex gap-1">
                                    <ButtonUtility
                                        size="xs"
                                        color="tertiary"
                                        icon={ArrowUp}
                                        tooltip="Subir"
                                        isDisabled={indice === 0}
                                        onClick={() => mover(indice, -1)}
                                    />
                                    <ButtonUtility
                                        size="xs"
                                        color="tertiary"
                                        icon={ArrowDown}
                                        tooltip="Descer"
                                        isDisabled={indice === ids.length - 1}
                                        onClick={() => mover(indice, 1)}
                                    />
                                    <ButtonUtility
                                        size="xs"
                                        color="tertiary"
                                        icon={Trash01}
                                        tooltip="Remover do conjunto"
                                        onClick={() => onChange(ids.filter((outro) => outro !== id))}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
            {!somenteLeitura && disponiveis.length > 0 && (
                <div className="md:w-96">
                    <Select
                        aria-label="Adicionar regra"
                        placeholder="Adicionar regra ao final"
                        size="sm"
                        items={disponiveis.map((r) => ({ id: r.id, label: r.nome, supportingText: r.dimensao }))}
                        selectedKey={null}
                        onSelectionChange={(chave) => chave && onChange([...ids, String(chave)])}
                    >
                        {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
                    </Select>
                </div>
            )}
            {fieldState.error && <p className="text-sm text-error-primary">{fieldState.error.message}</p>}
            {!somenteLeitura && (
                <p className="text-xs text-quaternary">A remoção de repetições sempre ocorre depois das ações de normalização, qualquer que seja a posição.</p>
            )}
        </div>
    );
}
