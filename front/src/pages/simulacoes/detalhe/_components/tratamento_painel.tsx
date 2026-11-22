import { useState } from "react";
import { CheckVerified01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Alert } from "@/components/feedback/alert";
import { toast } from "@/components/feedback/toast";
import { Card } from "@/components/layout/card";
import { DetailField } from "@/components/layout/section";
import { ConfirmModal } from "@/components/overlays/confirm_modal";
import { useAplicarTratamento } from "@/hooks/treatments/use_tratamentos";
import type { ApiError } from "@/lib/api";
import { formatDateTime } from "@/lib/moment";
import { ROTULO_ACAO } from "@/types/rules/regra";
import type { Simulacao } from "@/types/simulations";
import type { ResultadoTratamento } from "@/types/treatments";

/** Ações na ordem em que serão aplicadas: normalizações primeiro, remoção de repetições ao final. */
function acoesOrdenadas(simulacao: Simulacao) {
    const comAcao = [...simulacao.configuracaoExecutada.regras].sort((a, b) => a.ordem - b.ordem).filter((r) => r.configuracao.acao);
    const normalizacoes = comAcao.filter((r) => r.configuracao.acao!.tipo !== "REMOVER_REPETICOES");
    const remocoes = comAcao.filter((r) => r.configuracao.acao!.tipo === "REMOVER_REPETICOES");
    return [...normalizacoes, ...remocoes];
}

function Resultado({ resultado }: { resultado: ResultadoTratamento }) {
    return (
        <Card titulo="Tratamento confirmado" descricao="Nova versão e extrato de auditoria foram gravados na mesma transação.">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField rotulo="Nova versão">v{resultado.versaoSaida.numero}</DetailField>
                <DetailField rotulo="Linhas alteradas / removidas">
                    {resultado.totalLinhasAlteradas} / {resultado.totalLinhasRemovidas}
                </DetailField>
                <DetailField rotulo="Instante (UTC)">{formatDateTime(resultado.instanteUtc)}</DetailField>
                <DetailField rotulo="Original">v{resultado.versaoEntrada.numero} preservada</DetailField>
            </dl>
            <div className="flex flex-wrap gap-3">
                <Button color="secondary" href={`/datasets/${resultado.versaoSaida.datasetId}`}>
                    Ver nova versão
                </Button>
                <Button color="secondary" href={`/auditoria/${resultado.extratoId}`}>
                    Ver extrato de auditoria
                </Button>
            </div>
            <p className="text-xs text-quaternary">A nova versão ainda não tem diagnóstico: simule-a para obter os indicadores.</p>
        </Card>
    );
}

/** T05 — Revisão e aplicação das ações do catálogo (RF004, UC-04, UC-05). */
export function TratamentoPainel({ simulacao }: { simulacao: Simulacao }) {
    const aplicar = useAplicarTratamento();
    const [revisando, setRevisando] = useState(false);
    const [revisado, setRevisado] = useState(false);
    const [erro, setErro] = useState<ApiError | null>(null);
    const [resultado, setResultado] = useState<ResultadoTratamento | null>(null);
    const acoes = acoesOrdenadas(simulacao);

    if (resultado) {
        return <Resultado resultado={resultado} />;
    }
    if (!simulacao.vigente) {
        return null;
    }
    if (!simulacao.aplicavel) {
        return (
            <Alert variante="info" titulo="Não há alterações previstas">
                A simulação não prevê alterações; nenhuma versão ou extrato será criado.
            </Alert>
        );
    }

    const fechar = () => {
        setRevisando(false);
        setRevisado(false);
        setErro(null);
    };

    const confirmar = () => {
        setErro(null);
        aplicar.mutate(simulacao.id, {
            onSuccess: (dados) => {
                setResultado(dados);
                fechar();
                toast.success(`Versão ${dados.versaoSaida.numero} criada`, "Extrato de auditoria registrado.");
            },
            onError: (falha) => setErro(falha as ApiError),
        });
    };

    return (
        <Card
            titulo="Aplicar tratamento"
            descricao="As ações abaixo serão aplicadas sobre uma cópia da versão simulada, na ordem exibida. Não há edição manual de valores."
            acoes={
                <Button color="primary" iconLeading={CheckVerified01} onClick={() => setRevisando(true)}>
                    Revisar e aplicar
                </Button>
            }
        >
            <ol className="flex flex-col gap-2">
                {acoes.map((regra, indice) => (
                    <li key={regra.regraId} className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary">
                        <span className="w-6 text-center font-mono text-sm text-quaternary">{indice + 1}</span>
                        <span className="text-sm text-secondary">
                            <strong className="text-primary">{ROTULO_ACAO[regra.configuracao.acao!.tipo]}</strong>
                            {regra.configuracao.acao!.coluna ? ` na coluna “${regra.configuracao.acao!.coluna}”` : " pela chave da regra"} — {regra.nome} (r
                            {regra.revisao})
                        </span>
                    </li>
                ))}
            </ol>
            <ConfirmModal
                isOpen={revisando}
                aoFechar={fechar}
                titulo="Confirmar tratamento?"
                descricao={`Serão alteradas ${simulacao.totalPrevistoAlteradas} linha(s) e removidas ${simulacao.totalPrevistoRemovidas}. Uma nova versão será criada a partir da v${simulacao.versaoNumero}, que permanece intacta, e o extrato de auditoria será gravado junto.`}
                rotuloConfirmar="Aplicar tratamento"
                confirmando={aplicar.isPending}
                bloqueado={!revisado}
                aoConfirmar={confirmar}
            >
                {erro && (
                    <Alert variante="erro" titulo="O tratamento não foi aplicado">
                        {erro.message}
                    </Alert>
                )}
                <Checkbox isSelected={revisado} onChange={setRevisado} label="Revisei as ações, a ordem e a prévia das alterações." />
            </ConfirmModal>
        </Card>
    );
}
