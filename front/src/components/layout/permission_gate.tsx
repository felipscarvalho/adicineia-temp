import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/use_permissions";
import type { Operacao } from "@/types/auth";
import { ErrorState } from "./states";

/** Exibe a tela apenas para perfis com a operação; o backend responde 403 de qualquer forma. */
export function PermissionGate({ operacao, children }: { operacao: Operacao; children: ReactNode }) {
    const { can } = usePermissions();
    if (!can(operacao)) {
        return <ErrorState titulo="Acesso não permitido" mensagem="Seu perfil não tem permissão para esta tela." />;
    }
    return <>{children}</>;
}
