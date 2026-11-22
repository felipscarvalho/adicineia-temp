"use client";

import { type ReactNode, useSyncExternalStore } from "react";

const assinar = () => () => undefined;

/**
 * Renderiza o conteúdo só no navegador. Adaptação do padrão `use(browser())` + Suspense: a área
 * logada depende do cookie de sessão e do estado do navegador, então o servidor entrega apenas o
 * `fallback`, sem divergência de hidratação.
 */
export function ClientOnly({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
    const noNavegador = useSyncExternalStore(
        assinar,
        () => true,
        () => false,
    );
    return <>{noNavegador ? children : fallback}</>;
}
