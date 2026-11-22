import type { ReactNode } from "react";

/** Título da aba do navegador; o React 19 move o `<title>` para o `<head>`. */
export function TituloPagina({ titulo, children }: { titulo: string; children: ReactNode }) {
    return (
        <>
            <title>{`${titulo} · DataQualiSUS`}</title>
            {children}
        </>
    );
}
