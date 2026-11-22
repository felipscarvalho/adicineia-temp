import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { cx } from "@/utils/cx";

type Variante = "info" | "sucesso" | "aviso" | "erro";

const estilos: Record<Variante, { icone: typeof InfoCircle; caixa: string; cor: string }> = {
    info: { icone: InfoCircle, caixa: "ring-brand_alt", cor: "text-fg-brand-primary" },
    sucesso: { icone: CheckCircle, caixa: "ring-success_subtle", cor: "text-fg-success-primary" },
    aviso: { icone: AlertTriangle, caixa: "ring-warning_subtle", cor: "text-fg-warning-primary" },
    erro: { icone: AlertCircle, caixa: "ring-error_subtle", cor: "text-fg-error-primary" },
};

/** Alerta em linha (o Alert do Untitled UI é PRO). */
export function Alert({ variante = "info", titulo, children, className }: { variante?: Variante; titulo: string; children?: ReactNode; className?: string }) {
    const { icone: Icone, caixa, cor } = estilos[variante];
    return (
        <div role={variante === "erro" ? "alert" : "status"} className={cx("flex gap-3 rounded-xl glass p-4 ring-1", caixa, className)}>
            <Icone className={cx("mt-0.5 size-5 shrink-0", cor)} />
            <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-primary">{titulo}</p>
                {children && <div className="text-sm text-tertiary">{children}</div>}
            </div>
        </div>
    );
}
