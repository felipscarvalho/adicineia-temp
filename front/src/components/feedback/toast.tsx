import { AlertCircle, CheckCircle, InfoCircle } from "@untitledui/icons";
import { Toaster as SonnerToaster, toast as sonner } from "sonner";

/**
 * Toasts do projeto. Sempre importar daqui; nunca de "sonner" diretamente.
 * Visual padrão do Untitled UI (superfície primária com anel e sombra).
 */
export const toast = {
    success: (mensagem: string, descricao?: string) =>
        sonner.success(mensagem, { description: descricao, icon: <CheckCircle className="size-5 text-fg-success-primary" /> }),
    error: (mensagem: string, descricao?: string) =>
        sonner.error(mensagem, { description: descricao, icon: <AlertCircle className="size-5 text-fg-error-primary" /> }),
    info: (mensagem: string, descricao?: string) => sonner(mensagem, { description: descricao, icon: <InfoCircle className="size-5 text-fg-brand-primary" /> }),
};

export function Toaster() {
    return (
        <SonnerToaster
            position="bottom-right"
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: "flex w-full bg-primary items-start gap-3 rounded-xl p-4 shadow-lg ring-1 ring-secondary",
                    title: "text-sm font-semibold text-primary",
                    description: "text-sm text-tertiary",
                },
            }}
        />
    );
}
