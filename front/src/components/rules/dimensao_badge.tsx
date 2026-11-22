import { Badge } from "@/components/base/badges/badges";
import { type DimensaoQualidade, ROTULO_DIMENSAO } from "@/types/rules/regra";

const COR: Record<DimensaoQualidade, "brand" | "purple" | "orange"> = { UNICIDADE: "purple", COMPLETUDE: "brand", VALIDADE: "orange" };

export function DimensaoBadge({ dimensao }: { dimensao: DimensaoQualidade }) {
    return (
        <Badge type="pill-color" color={COR[dimensao]} size="sm">
            {ROTULO_DIMENSAO[dimensao]}
        </Badge>
    );
}
