import { useEffect, useRef, useState } from "react";

/**
 * Número de abertura de um modal. O conteúdo é renderizado com `key={sessao}`, então cada abertura
 * monta o formulário do zero com os `defaultValues` (sem `reset` em efeito).
 */
export function useOpenSession(isOpen: boolean): number {
    const [sessao, setSessao] = useState(0);
    const anterior = useRef(isOpen);
    useEffect(() => {
        if (isOpen && !anterior.current) {
            setSessao((valor) => valor + 1);
        }
        anterior.current = isOpen;
    }, [isOpen]);
    return sessao;
}
