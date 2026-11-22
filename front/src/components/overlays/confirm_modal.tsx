"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { ModalBase } from "./modal_base";

/** Confirmação de ação; `destrutivo` usa o botão de perigo. */
export function ConfirmModal({
    isOpen,
    aoFechar,
    aoConfirmar,
    titulo,
    descricao,
    rotuloConfirmar = "Confirmar",
    destrutivo = false,
    confirmando,
    bloqueado = false,
    children,
}: {
    isOpen: boolean;
    aoFechar: () => void;
    aoConfirmar: () => void;
    titulo: string;
    descricao?: ReactNode;
    rotuloConfirmar?: string;
    destrutivo?: boolean;
    confirmando?: boolean;
    bloqueado?: boolean;
    children?: ReactNode;
}) {
    return (
        <ModalBase isOpen={isOpen} aoFechar={aoFechar} titulo={titulo} descricao={descricao}>
            {children}
            <div className="flex justify-end gap-3">
                <Button size="md" color="secondary" className="glass-control" onClick={aoFechar} isDisabled={confirmando}>
                    Cancelar
                </Button>
                <Button
                    size="md"
                    color={destrutivo ? "primary-destructive" : "primary"}
                    className={destrutivo ? "glass-destructive" : "glass-brand"}
                    onClick={aoConfirmar}
                    isLoading={confirmando}
                    isDisabled={bloqueado}
                >
                    {rotuloConfirmar}
                </Button>
            </div>
        </ModalBase>
    );
}
