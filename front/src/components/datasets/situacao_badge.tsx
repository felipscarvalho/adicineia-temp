import { BadgeWithDot } from "@/components/base/badges/badges";
import type { SituacaoDataset } from "@/types/datasets";

/** Situação de cadastro (MOD-15): ativo ou excluído logicamente. */
export function SituacaoBadge({ situacao }: { situacao: SituacaoDataset }) {
    return situacao === "ATIVO" ? (
        <BadgeWithDot type="pill-color" color="success" size="sm">
            Ativo
        </BadgeWithDot>
    ) : (
        <BadgeWithDot type="pill-color" color="gray" size="sm">
            Excluído logicamente
        </BadgeWithDot>
    );
}

export function abreviarHash(hash: string): string {
    return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
}
