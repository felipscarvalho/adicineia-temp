import { z } from "zod";
import { arquivoCsvSchema, separadorSchema } from "./arquivo_csv";

/** Edição de metadados: distinta da edição de conteúdo (RN04). */
export const metadadosSchema = z.object({
    nome: z.string().trim().min(1, "O nome não pode ficar vazio.").max(200, "Use no máximo 200 caracteres."),
    descricao: z.string().max(2000, "Use no máximo 2.000 caracteres."),
});

export type MetadadosForm = z.infer<typeof metadadosSchema>;

export const novaVersaoSchema = z.object({ separador: separadorSchema, arquivo: arquivoCsvSchema });

export type NovaVersaoForm = z.infer<typeof novaVersaoSchema>;
