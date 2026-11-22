"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock01, Mail01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/feedback/alert";
import { FormInput } from "@/components/forms/form_input";
import { telaInicial } from "@/components/navigation/navegacao";
import type { ApiError } from "@/lib/api";
import { type EntrarForm, entrarSchema } from "@/schemas/auth/entrar";
import { useUserStore } from "@/stores/user_store";

/** Formulário da tela T00. Credenciais inválidas recebem a mensagem genérica do backend (UC-08, 2a). */
export function LoginForm() {
    const router = useRouter();
    const login = useUserStore((estado) => estado.login);
    const [erro, setErro] = useState<string | null>(null);
    const { control, handleSubmit, reset, formState } = useForm<EntrarForm>({ resolver: zodResolver(entrarSchema), defaultValues: { email: "", senha: "" } });

    const enviar = handleSubmit(async (dados) => {
        setErro(null);
        try {
            const sessao = await login(dados.email, dados.senha);
            router.replace(telaInicial(sessao.permissoes));
        } catch (falha) {
            setErro((falha as ApiError).message);
            reset({ email: dados.email, senha: "" });
        }
    });

    return (
        <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
            {erro && <Alert variante="erro" titulo={erro} />}
            <FormInput
                control={control}
                name="email"
                label="E-mail"
                type="email"
                placeholder="voce@exemplo.com"
                icon={Mail01}
                isRequired
                autoComplete="username"
            />
            <FormInput
                control={control}
                name="senha"
                label="Senha"
                type="password"
                placeholder="••••••••"
                icon={Lock01}
                isRequired
                autoComplete="current-password"
            />
            <Button type="submit" size="lg" color="primary" className="glass-brand" isLoading={formState.isSubmitting}>
                Entrar
            </Button>
        </form>
    );
}
