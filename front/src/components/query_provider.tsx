import { type ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** QueryClient do TanStack Query, criado uma vez no layout raiz; cache só em memória, opções padrão. */
export function QueryProvider({ children }: { children: ReactNode }) {
    const [cliente] = useState(() => new QueryClient());
    return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}
