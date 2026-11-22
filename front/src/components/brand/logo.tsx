import { CheckDone01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

/** Marca do DataQualiSUS. */
export function Logo({ className, compacto = false }: { className?: string; compacto?: boolean }) {
    return (
        <span className={cx("flex items-center gap-2 text-primary", className)}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-solid">
                <CheckDone01 className="size-5 text-white" />
            </span>
            {!compacto && (
                <span className="text-lg font-semibold tracking-tight">
                    DataQuali<span className="text-brand-secondary">SUS</span>
                </span>
            )}
        </span>
    );
}
