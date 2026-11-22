import { Plus, Trash01 } from "@untitledui/icons";
import { type Control, type FieldPath, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { FormInput, FormTextArea } from "@/components/forms/form_input";
import { FormSelect } from "@/components/forms/form_select";
import { Section } from "@/components/layout/section";
import { LIMITE_CONDICOES, OPERADORES_COM_CONSTANTE, type RegraForm } from "@/schemas/rules/regra";
import { type Catalogo, ROTULO_DIMENSAO, ROTULO_TIPO, type TipoColuna } from "@/types/rules/regra";
import type { Vocabulario } from "@/types/rules/vocabulario";

const ITENS_TIPO = (Object.keys(ROTULO_TIPO) as TipoColuna[]).map((id) => ({ id, label: ROTULO_TIPO[id] }));
const ITENS_DIMENSAO = (Object.keys(ROTULO_DIMENSAO) as (keyof typeof ROTULO_DIMENSAO)[]).map((id) => ({ id, label: ROTULO_DIMENSAO[id] }));
const ITENS_CAIXA = [
    { id: "MAIUSCULAS", label: "Maiúsculas" },
    { id: "MINUSCULAS", label: "Minúsculas" },
];

type Campo = FieldPath<RegraForm>;

/**
 * Configuração visual de regra (tela T03): somente dimensões, tipos, operadores e ações do catálogo
 * publicado pelo backend. Não há campo de script, SQL ou expressão livre (ADR-002).
 */
export function RegraCampos({
    control,
    catalogo,
    vocabularios,
    somenteLeitura = false,
}: {
    control: Control<RegraForm>;
    catalogo: Catalogo;
    vocabularios: Vocabulario[];
    somenteLeitura?: boolean;
}) {
    const dimensao = useWatch({ control, name: "dimensao" });
    const acaoTipo = useWatch({ control, name: "acaoTipo" });
    const colunasForm = useWatch({ control, name: "colunas" });
    const condicoesForm = useWatch({ control, name: "condicoes" });
    const colunas = useFieldArray({ control, name: "colunas" });
    const condicoes = useFieldArray({ control, name: "condicoes" });

    const validade = dimensao === "VALIDADE";
    const colunasDaRegra = validade
        ? Array.from(new Map((condicoesForm ?? []).filter((c) => c.coluna).map((c) => [c.coluna, c.tipo as TipoColuna])).entries())
        : (colunasForm ?? []).filter((c) => c.nome).map((c) => [c.nome, c.tipo as TipoColuna] as const);
    const acoes = catalogo.acoes.filter((a) => a.dimensoes.includes(dimensao));
    const acaoAtual = catalogo.acoes.find((a) => a.tipo === acaoTipo);
    const colunasDaAcao = colunasDaRegra.filter(([, tipo]) => !acaoAtual || acaoAtual.tiposColuna.includes(tipo));
    const itensVocabulario = vocabularios.map((v) => ({ id: v.id, label: `${v.nome} ${v.versao}`, supportingText: v.origem }));

    return (
        <fieldset disabled={somenteLeitura} className="flex flex-col gap-6">
            <Section titulo="Identificação">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormInput control={control} name="nome" label="Nome da regra" isRequired isDisabled={somenteLeitura} />
                    <FormSelect control={control} name="dimensao" label="Dimensão" itens={ITENS_DIMENSAO} isRequired isDisabled={somenteLeitura} />
                </div>
                <FormTextArea control={control} name="descricao" label="Descrição" rows={2} isDisabled={somenteLeitura} />
            </Section>

            {!validade && (
                <Section
                    titulo={dimensao === "UNICIDADE" ? "Chave de unicidade" : "Colunas que devem estar preenchidas"}
                    descricao={
                        dimensao === "UNICIDADE"
                            ? "A primeira ocorrência na ordem original representa a chave; cada repetição posterior é violação. Chaves com coluna vazia ficam para a completude."
                            : `Campo vazio ou só com espaços falha; até ${LIMITE_CONDICOES} colunas.`
                    }
                >
                    {colunas.fields.map((campo, i) => (
                        <div key={campo.id} className="grid items-start gap-3 md:grid-cols-[1fr_14rem_auto]">
                            <FormInput
                                control={control}
                                name={`colunas.${i}.nome` as Campo}
                                label={i === 0 ? "Coluna" : undefined}
                                aria-label={`Coluna ${i + 1}`}
                                isDisabled={somenteLeitura}
                            />
                            <FormSelect
                                control={control}
                                name={`colunas.${i}.tipo` as Campo}
                                label={i === 0 ? "Tipo" : undefined}
                                itens={ITENS_TIPO}
                                isDisabled={somenteLeitura}
                            />
                            {!somenteLeitura && (
                                <ButtonUtility
                                    className={i === 0 ? "md:mt-6" : undefined}
                                    size="sm"
                                    color="tertiary"
                                    icon={Trash01}
                                    tooltip="Remover coluna"
                                    onClick={() => colunas.remove(i)}
                                />
                            )}
                        </div>
                    ))}
                    {!somenteLeitura && (
                        <div>
                            <Button
                                size="sm"
                                color="secondary"

                                iconLeading={Plus}
                                onClick={() => colunas.append({ nome: "", tipo: "TEXTO" })}
                            >
                                Adicionar coluna
                            </Button>
                        </div>
                    )}
                    {dimensao === "COMPLETUDE" && (
                        <FormInput
                            control={control}
                            name="marcadores"
                            label="Marcadores de ausência"
                            dica="Separados por vírgula, comparados literalmente (ex.: ignorado, IGN)."
                            isDisabled={somenteLeitura}
                        />
                    )}
                </Section>
            )}

            {validade && (
                <Section
                    titulo="Condições"
                    descricao={`Até ${LIMITE_CONDICOES} condições simples, ligadas só por E ou só por OU. Valor não convertível ao tipo é violação de validade.`}
                >
                    <div className="md:w-64">
                        <FormSelect
                            control={control}
                            name="combinador"
                            label="Combinar condições por"
                            itens={[
                                { id: "E", label: "E (todas)" },
                                { id: "OU", label: "OU (alguma)" },
                            ]}
                            isDisabled={somenteLeitura}
                        />
                    </div>
                    {condicoes.fields.map((campo, i) => {
                        const condicao = condicoesForm?.[i];
                        const operadores = catalogo.operadores.filter((o) => o.tipos.includes((condicao?.tipo ?? "TEXTO") as TipoColuna));
                        const operador = condicao?.operador ?? "";
                        return (
                            <div key={campo.id} className="flex flex-col gap-3 rounded-xl p-4 ring-1 ring-secondary">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-secondary">Condição {i + 1}</p>
                                    {!somenteLeitura && (
                                        <ButtonUtility
                                            size="xs"
                                            color="tertiary"
                                            icon={Trash01}
                                            tooltip="Remover condição"
                                            onClick={() => condicoes.remove(i)}
                                        />
                                    )}
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                    <FormInput control={control} name={`condicoes.${i}.coluna` as Campo} label="Coluna" isDisabled={somenteLeitura} />
                                    <FormSelect
                                        control={control}
                                        name={`condicoes.${i}.tipo` as Campo}
                                        label="Tipo"
                                        itens={ITENS_TIPO}
                                        isDisabled={somenteLeitura}
                                    />
                                    <FormSelect
                                        control={control}
                                        name={`condicoes.${i}.operador` as Campo}
                                        label="Operador"
                                        itens={operadores.map((o) => ({ id: o.codigo, label: o.rotulo }))}
                                        isDisabled={somenteLeitura}
                                    />
                                </div>
                                {OPERADORES_COM_CONSTANTE.has(operador) && (
                                    <FormInput
                                        control={control}
                                        name={`condicoes.${i}.valor` as Campo}
                                        label="Valor"
                                        dica={
                                            condicao?.tipo === "DECIMAL"
                                                ? "Ponto decimal, sem milhares."
                                                : condicao?.tipo === "DATA"
                                                  ? "AAAA-MM-DD."
                                                  : undefined
                                        }
                                        isDisabled={somenteLeitura}
                                    />
                                )}
                                {operador === "PERTENCE_LISTA" && (
                                    <FormTextArea
                                        control={control}
                                        name={`condicoes.${i}.valores` as Campo}
                                        label="Lista literal"
                                        dica="Um valor por linha."
                                        rows={3}
                                        isDisabled={somenteLeitura}
                                    />
                                )}
                                {operador === "PERTENCE_VOCABULARIO" && (
                                    <FormSelect
                                        control={control}
                                        name={`condicoes.${i}.vocabularioId` as Campo}
                                        label="Vocabulário oficial e versão"
                                        itens={itensVocabulario}
                                        placeholder={itensVocabulario.length ? "Selecione" : "Nenhum vocabulário disponível"}
                                        isDisabled={somenteLeitura}
                                    />
                                )}
                            </div>
                        );
                    })}
                    {!somenteLeitura && (
                        <div>
                            <Button
                                size="sm"
                                color="secondary"

                                iconLeading={Plus}
                                isDisabled={condicoes.fields.length >= LIMITE_CONDICOES}
                                onClick={() =>
                                    condicoes.append({ coluna: "", tipo: "TEXTO", operador: "NAO_VAZIO", valor: "", valores: "", vocabularioId: "" })
                                }
                            >
                                Adicionar condição
                            </Button>
                        </div>
                    )}
                </Section>
            )}

            <Section
                titulo="Ação de tratamento (opcional)"
                descricao="Só ações do catálogo fechado. Nenhuma ação é aplicada sem simulação e confirmação explícita."
            >
                <div className="grid gap-3 md:grid-cols-2">
                    <FormSelect
                        control={control}
                        name="acaoTipo"
                        label="Ação"
                        itens={[{ id: "SEM_ACAO", label: "Somente avaliar (sem ação)" }, ...acoes.map((a) => ({ id: a.tipo, label: a.rotulo }))]}
                        isDisabled={somenteLeitura}
                    />
                    {acaoTipo !== "SEM_ACAO" && acaoTipo !== "REMOVER_REPETICOES" && (
                        <FormSelect
                            control={control}
                            name="acaoColuna"
                            label="Coluna da ação"
                            itens={colunasDaAcao.map(([nome]) => ({ id: nome, label: nome }))}
                            placeholder={colunasDaAcao.length ? "Selecione" : "Nenhuma coluna compatível"}
                            isDisabled={somenteLeitura}
                        />
                    )}
                    {acaoTipo === "CONVERTER_CAIXA" && (
                        <FormSelect control={control} name="acaoCaixa" label="Converter para" itens={ITENS_CAIXA} isDisabled={somenteLeitura} />
                    )}
                    {acaoTipo === "PREENCHER_VAZIO" && (
                        <FormInput
                            control={control}
                            name="acaoValor"
                            label="Valor literal"
                            dica="Compatível com o tipo da coluna; nenhum valor é inferido."
                            isDisabled={somenteLeitura}
                        />
                    )}
                </div>
                {acaoTipo === "REMOVER_REPETICOES" && (
                    <p className="text-sm text-tertiary">Remove as repetições da chave desta regra, depois das ações de normalização.</p>
                )}
            </Section>
        </fieldset>
    );
}
