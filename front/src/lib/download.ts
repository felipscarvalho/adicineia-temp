/** Dispara o download de um arquivo recebido da API no navegador. */
export function salvarArquivo(conteudo: Blob, nomeArquivo: string): void {
    const url = URL.createObjectURL(conteudo);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
