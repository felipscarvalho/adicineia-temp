import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme_toggle";
import { LoginForm } from "./_components/login_form";

export const metadata: Metadata = { title: "Entrar" };

/** T00 — Autenticação com conta previamente cadastrada (RF007, UC-08). */
export default function PaginaLogin() {
    return (
        <main className="flex min-h-dvh items-center justify-center px-4 py-10">
            <div className="flex w-full max-w-md flex-col gap-8 rounded-2xl glass p-8 shadow-lg ring-1 ring-secondary">
                <div className="flex items-start justify-between">
                    <Logo />
                    <ThemeToggle />
                </div>
                <div className="flex flex-col gap-1">
                    <h1 className="font-display text-display-xs font-semibold text-primary">Entrar</h1>
                    <p className="text-md text-tertiary">Use a conta cadastrada pela equipe para acessar as funções do seu perfil.</p>
                </div>
                <LoginForm />
                <p className="text-xs text-quaternary">Ambiente acadêmico com dados sintéticos ou abertos, sem identificação pessoal.</p>
            </div>
        </main>
    );
}
