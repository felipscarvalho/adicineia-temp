import { ArrowLeft } from "@untitledui/icons";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";

export function NaoEncontradaPagina() {
    const navegar = useNavigate();
    return (
        <section className="flex min-h-dvh items-center justify-center bg-secondary px-4">
            <div className="flex max-w-lg flex-col gap-4 rounded-2xl bg-primary p-8 shadow-xs ring-1 ring-secondary">
                <span className="text-md font-semibold text-brand-secondary">Erro 404</span>
                <h1 className="text-display-xs font-semibold text-primary">Página não encontrada</h1>
                <p className="text-md text-tertiary">O endereço acessado não existe ou foi removido.</p>
                <div>
                    <Button color="secondary" iconLeading={ArrowLeft} onClick={() => navegar(-1)}>
                        Voltar
                    </Button>
                </div>
            </div>
        </section>
    );
}
