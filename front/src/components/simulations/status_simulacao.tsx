import { BadgeWithDot } from "@/components/base/badges/badges";
import { ROTULO_STATUS, type StatusSimulacao } from "@/types/simulations";

const COR: Record<StatusSimulacao, "brand" | "success" | "warning" | "error" | "gray" | "blue"> = {
    EM_EXECUCAO: "blue",
    CONCLUIDA: "success",
    TEMPO_ESGOTADO: "warning",
    FALHA: "error",
    INVALIDADA: "gray",
    CONSOLIDADA: "brand",
};

/** StatusSimulacao (MOD-10). */
export function StatusSimulacaoBadge({ status }: { status: StatusSimulacao }) {
    return (
        <BadgeWithDot type="pill-color" color={COR[status]} size="sm">
            {ROTULO_STATUS[status]}
        </BadgeWithDot>
    );
}
