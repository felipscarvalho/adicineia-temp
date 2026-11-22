import { z } from "zod";
import { LIMITE_BYTES } from "@/types/datasets";

/**
 * Arquivo CSV escolhido pelo analista. Checagens rápidas para UX; codificação, cabeçalho, estrutura
 * e limites de registros e colunas são validados pelo servidor (ValidadorCsv).
 */
export const arquivoCsvSchema = z
    .instanceof(File, { message: "Selecione um arquivo CSV." })
    .refine((arquivo) => /\.csv$/i.test(arquivo.name), "O arquivo deve ter a extensão .csv.")
    .refine((arquivo) => arquivo.size > 0, "O arquivo está vazio.")
    .refine((arquivo) => arquivo.size <= LIMITE_BYTES, "O arquivo excede o limite de 10.000.000 bytes.");

export const separadorSchema = z.enum(["VIRGULA", "PONTO_E_VIRGULA"], { message: "Escolha o separador." });
