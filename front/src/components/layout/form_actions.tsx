import { Button } from "@/components/base/buttons/button";

/** Descartar/Salvar das telas de edição direta: ativos somente quando algo mudou. */
export function FormActions({ alterado, salvando, aoDescartar }: { alterado: boolean; salvando?: boolean; aoDescartar: () => void }) {
    return (
        <div className="flex justify-end gap-3">
            <Button type="button" size="sm" color="secondary" className="glass-control" isDisabled={!alterado || salvando} onClick={aoDescartar}>
                Descartar
            </Button>
            <Button type="submit" size="sm" color="primary" className="glass-brand" isDisabled={!alterado} isLoading={salvando}>
                Salvar
            </Button>
        </div>
    );
}
