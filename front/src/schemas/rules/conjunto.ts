import { z } from "zod";

export const conjuntoSchema = z.object({
    nome: z.string().trim().min(1, "Informe o nome do conjunto.").max(200, "Use no máximo 200 caracteres."),
    descricao: z.string().max(2000, "Use no máximo 2.000 caracteres."),
    /** Regras na ordem explícita de execução. */
    regras: z
        .array(z.string())
        .max(100, "Use no máximo 100 regras.")
        .refine((ids) => new Set(ids).size === ids.length, "A mesma regra foi incluída mais de uma vez."),
});

export type ConjuntoForm = z.infer<typeof conjuntoSchema>;
