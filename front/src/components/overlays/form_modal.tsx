import type { FormEvent, ReactNode } from "react";
import { Button } from "@/components/base/buttons/button";
import { ModalBase } from "./modal_base";

/** Formulário em modal (criação de registros e ações pontuais). */
export function FormModal({
    isOpen,
    aoFechar,
    titulo,
    descricao,
    rotuloEnviar = "Salvar",
    enviando,
    aoEnviar,
    largura,
    children,
}: {
    isOpen: boolean;
    aoFechar: () => void;
    titulo: string;
    descricao?: ReactNode;
    rotuloEnviar?: string;
    enviando?: boolean;
    aoEnviar: (evento: FormEvent<HTMLFormElement>) => void;
    largura?: string;
    children: ReactNode;
}) {
    return (
        <ModalBase isOpen={isOpen} aoFechar={aoFechar} titulo={titulo} descricao={descricao} largura={largura}>
            <form noValidate onSubmit={aoEnviar} className="flex flex-col gap-5">
                <div className="flex flex-col gap-4">{children}</div>
                <div className="flex justify-end gap-3">
                    <Button type="button" size="md" color="secondary" onClick={aoFechar} isDisabled={enviando}>
                        Cancelar
                    </Button>
                    <Button type="submit" size="md" color="primary" isLoading={enviando}>
                        {rotuloEnviar}
                    </Button>
                </div>
            </form>
        </ModalBase>
    );
}
