import { File06, UploadCloud02 } from "@untitledui/icons";
import { type Control, type FieldPath, type FieldValues, useController } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { FileTrigger } from "@/components/base/file-upload-trigger/file-upload-trigger";

/** Seleção do arquivo CSV ligada ao react-hook-form (importação e nova versão). */
export function CampoArquivoCsv<T extends FieldValues>({ control, name }: { control: Control<T>; name: FieldPath<T> }) {
    const {
        field: { value, onChange },
        fieldState,
    } = useController({ control, name });
    const arquivo = value as File | undefined;
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-secondary">Arquivo CSV</span>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-primary p-3 shadow-xs ring-1 ring-primary">
                <div className="flex min-w-0 items-center gap-2">
                    <File06 className="size-5 shrink-0 text-fg-quaternary" />
                    <span className="truncate text-sm text-tertiary">
                        {arquivo ? `${arquivo.name} · ${arquivo.size.toLocaleString("pt-BR")} bytes` : "UTF-8, até 10 MB, 100.000 registros e 100 colunas"}
                    </span>
                </div>
                <FileTrigger acceptedFileTypes={[".csv", "text/csv"]} onSelect={(arquivos) => onChange(arquivos?.[0])}>
                    <Button type="button" size="sm" color="secondary" iconLeading={UploadCloud02}>
                        Escolher
                    </Button>
                </FileTrigger>
            </div>
            {fieldState.error && <p className="text-sm text-error-primary">{fieldState.error.message}</p>}
        </div>
    );
}
