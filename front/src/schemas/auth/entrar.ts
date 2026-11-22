import { z } from "zod";

/** Entrada com conta previamente cadastrada (UC-08). A verificação real é feita pelo backend. */
export const entrarSchema = z.object({
    email: z.string().trim().min(1, "Informe o e-mail.").email("Informe um e-mail válido."),
    senha: z.string().min(1, "Informe a senha."),
});

export type EntrarForm = z.infer<typeof entrarSchema>;
