import moment from "moment";
import "moment/locale/pt-br";

moment.locale("pt-br");

/** Data no formato DD/MM/YYYY (padrão de exibição do projeto). */
export function formatDate(valor: string | Date | null | undefined): string {
    return valor ? moment(valor).format("DD/MM/YYYY") : "—";
}

/** Data e hora local, usada em instantes de avaliação, simulação e auditoria. */
export function formatDateTime(valor: string | Date | null | undefined): string {
    return valor ? moment(valor).format("DD/MM/YYYY HH:mm:ss") : "—";
}

export default moment;
