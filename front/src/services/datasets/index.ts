import { type Pagina, apiDelete, apiGet, apiGetPage, apiPatch, apiPost } from "@/lib/api";
import type { Dataset, DatasetDetalhe, ImportarDatasetPayload, PaginaRegistrosResposta, RegistroVersao, SeparadorCsv, Versao } from "@/types/datasets";

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

/** GET /datasets/:id: metadados e histórico de versões (também de dataset excluído). */
export function obterDataset(id: string): Promise<DatasetDetalhe> {
    return apiGet<DatasetDetalhe>(`/datasets/${id}`);
}

/** PATCH /datasets/:id: só nome e descrição; o conteúdo não muda (RN04). */
export function atualizarMetadados(id: string, dados: { nome: string; descricao: string }): Promise<Dataset> {
    return apiPatch<Dataset>(`/datasets/${id}`, dados);
}

/** POST /datasets/:id/versoes (multipart): nova versão vinculada à mais recente. */
export function importarNovaVersao(id: string, dados: { arquivo: File; separador: SeparadorCsv }): Promise<Versao> {
    const formulario = new FormData();
    formulario.append("separador", dados.separador);
    formulario.append("arquivo", dados.arquivo, dados.arquivo.name);
    return apiPost<Versao>(`/datasets/${id}/versoes`, formulario);
}

/** DELETE /datasets/:id: exclusão lógica (versões e auditoria preservadas). */
export function excluirDataset(id: string): Promise<Dataset> {
    return apiDelete<Dataset>(`/datasets/${id}`);
}

/** GET /datasets/:id/versoes/:versaoId/registros: registros lidos do arquivo imutável, paginados. */
export function listarRegistros(id: string, versaoId: string, pagina: number, tamanho: number): Promise<Pagina<RegistroVersao> & { colunas: string[] }> {
    let colunas: string[] = [];
    return apiGetPage<RegistroVersao, PaginaRegistrosResposta>(`/datasets/${id}/versoes/${versaoId}/registros`, { pagina, tamanho }, (resposta) => {
        colunas = resposta.colunas;
        return { itens: resposta.registros, total: resposta.totalRegistros };
    }).then((paginaRegistros) => ({ ...paginaRegistros, colunas }));
}
