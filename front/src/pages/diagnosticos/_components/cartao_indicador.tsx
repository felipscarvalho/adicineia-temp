import { ProgressBarBase } from "@/components/base/progress-indicators/progress-indicators";
import type { Indicador } from "@/types/diagnostics";
import { ROTULO_DIMENSAO } from "@/types/rules/regra";

/** Cartão de uma dimensão: percentual, numerador, denominador, regras e colunas (RN01). */
export function CartaoIndicador({ indicador }: { indicador: Indicador }) {
    const avaliada = indicador.situacao === "AVALIADA";
    return (
        <article aria-label={ROTULO_DIMENSAO[indicador.dimensao]} className="flex flex-col gap-4 rounded-2xl bg-primary p-5 ring-1 ring-secondary">
            <header className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-secondary">{ROTULO_DIMENSAO[indicador.dimensao]}</h3>
                {!avaliada && <span className="text-xs font-medium text-quaternary uppercase">Sem regra</span>}
            </header>
            {avaliada ? (
                <>
                    <p className="font-display text-display-md font-semibold text-primary">{indicador.percentual!.toFixed(2).replace(".", ",")}%</p>
                    <ProgressBarBase value={indicador.percentual!} />
                    <dl className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <dt className="text-xs text-quaternary">Aprovadas</dt>
                            <dd className="text-secondary">{indicador.numerador!.toLocaleString("pt-BR")}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-quaternary">Total de linhas</dt>
                            <dd className="text-secondary">{indicador.denominador!.toLocaleString("pt-BR")}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-quaternary">Com violação</dt>
                            <dd className="text-secondary">{indicador.linhasComViolacao!.toLocaleString("pt-BR")}</dd>
                        </div>
                    </dl>
                </>
            ) : (
                <p className="font-display text-display-xs font-semibold text-tertiary">Não avaliada</p>
            )}
            <div className="flex flex-col gap-1 border-t border-secondary pt-3">
                <p className="text-xs font-medium text-quaternary uppercase">Regras executadas</p>
                {indicador.regras.length === 0 ? (
                    <p className="text-sm text-tertiary">Nenhuma regra desta dimensão no conjunto; a ausência não é resultado desfavorável.</p>
                ) : (
                    <ul className="flex flex-col gap-0.5 text-sm text-secondary">
                        {indicador.regras.map((regra) => (
                            <li key={regra.regraId}>
                                {regra.nome}{" "}
                                <span className="text-tertiary">
                                    (r{regra.revisao}) · {regra.colunas.join(", ")}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </article>
    );
}
