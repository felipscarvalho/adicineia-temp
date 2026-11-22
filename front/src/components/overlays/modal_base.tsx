import type { ReactNode } from "react";
import { XClose } from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

/** Moldura comum dos modais do projeto (vidro forte). */
export function ModalBase({
    isOpen,
    aoFechar,
    titulo,
    descricao,
    largura = "max-w-lg",
    children,
}: {
    isOpen: boolean;
    aoFechar: () => void;
    titulo: string;
    descricao?: ReactNode;
    largura?: string;
    children: ReactNode;
}) {
    return (
        <ModalOverlay isOpen={isOpen} onOpenChange={(aberto) => !aberto && aoFechar()} isDismissable>
            <Modal className={cx("ring-1 ring-secondary", largura)}>
                <Dialog aria-label={titulo}>
                    <div className="flex w-full flex-col gap-5 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-lg font-semibold text-primary">{titulo}</h2>
                                {descricao && <p className="text-sm text-tertiary">{descricao}</p>}
                            </div>
                            <ButtonUtility size="sm" color="tertiary" icon={XClose} tooltip="Fechar" onClick={aoFechar} />
                        </div>
                        {children}
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
}
