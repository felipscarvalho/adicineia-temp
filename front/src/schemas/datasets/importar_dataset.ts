import { z } from "zod";
import { arquivoCsvSchema, separadorSchema } from "./arquivo_csv";

export const importarDatasetSchema = z.object({
    nome: z.string().trim().min(1, "Informe o nome do dataset.").max(200, "Use no máximo 200 caracteres."),
    descricao: z.string().max(2000, "Use no máximo 2.000 caracteres."),
    separador: separadorSchema,
    arquivo: arquivoCsvSchema,
});

export type ImportarDatasetForm = z.infer<typeof importarDatasetSchema>;
