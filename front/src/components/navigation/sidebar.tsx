import type { FC } from "react";
import { LogOut01 } from "@untitledui/icons";
import { useLocation } from "react-router";
import { NavItemBase } from "@/components/application/app-navigation/base-components/nav-item";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme_toggle";
import { type Operacao, ROTULO_PAPEL, type Usuario } from "@/types/auth";
import { cx } from "@/utils/cx";

export interface ItemNavegacao {
    rotulo: string;
    href: string;
    icone: FC<{ className?: string }>;
    operacao: Operacao;
}

export interface SecaoNavegacao {
    rotulo: string;
    itens: ItemNavegacao[];
}

/** Barra lateral dividida em seções por módulo; recebe as seções já filtradas por permissão. */
export function Sidebar({ secoes, usuario, aoSair, className }: { secoes: SecaoNavegacao[]; usuario: Usuario; aoSair: () => void; className?: string }) {
    const caminho = useLocation().pathname;
    return (
        <aside
            aria-label="Navegação principal"
            className={cx("flex h-full w-full flex-col gap-6 overflow-y-auto rounded-2xl bg-primary p-4 ring-1 ring-secondary lg:w-68", className)}
        >
            <div className="px-2 pt-1">
                <Logo />
            </div>
            <nav className="flex flex-col gap-5">
                {secoes.map((secao) => (
                    <div key={secao.rotulo} className="flex flex-col gap-1">
                        <p className="px-3 text-xs font-bold text-quaternary uppercase">{secao.rotulo}</p>
                        <ul className="flex flex-col gap-0.5">
                            {secao.itens.map((item) => (
                                <li key={item.href}>
                                    <NavItemBase
                                        type="link"
                                        href={item.href}
                                        icon={item.icone}
                                        current={caminho === item.href || caminho.startsWith(`${item.href}/`)}
                                    >
                                        {item.rotulo}
                                    </NavItemBase>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="mt-auto flex items-center gap-2 rounded-xl p-3 ring-1 ring-secondary">
                <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold text-primary">{usuario.nome}</p>
                    <p className="truncate text-xs text-tertiary">{ROTULO_PAPEL[usuario.papel]}</p>
                </div>
                <ThemeToggle />
                <ButtonUtility size="sm" color="tertiary" icon={LogOut01} tooltip="Sair" onClick={aoSair} />
            </div>
        </aside>
    );
}
