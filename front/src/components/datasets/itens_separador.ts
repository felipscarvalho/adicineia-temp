import { ROTULO_SEPARADOR, type SeparadorCsv } from "@/types/datasets";

export const ITENS_SEPARADOR = (Object.keys(ROTULO_SEPARADOR) as SeparadorCsv[]).map((id) => ({ id, label: ROTULO_SEPARADOR[id] }));
