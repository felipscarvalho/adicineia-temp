import { apiGet, apiPost } from "@/lib/api";
import type { Dataset, ImportarDatasetPayload } from "@/types/datasets";

/** GET /datasets: listagem ativa (datasets excluídos logicamente não aparecem). */
export function listarDatasets(): Promise<Dataset[]> {
    return apiGet<Dataset[]>("/datasets");
}

/** POST /datasets (multipart): importação validada pelo servidor; nada é persistido se for rejeitada. */
export function importarDataset(payload: ImportarDatasetPayload): Promise<Dataset> {
    const formulario = new FormData();
    formulario.append("nome", payload.nome);
    if (payload.descricao) {
        formulario.append("descricao", payload.descricao);
    }
    formulario.append("separador", payload.separador);
    formulario.append("arquivo", payload.arquivo, payload.arquivo.name);
    return apiPost<Dataset>("/datasets", formulario);
}
