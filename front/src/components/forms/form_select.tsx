"use client";

import { type Control, type FieldPath, type FieldValues, useController } from "react-hook-form";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select-shared";

/** Seleção ligada ao react-hook-form. */
export function FormSelect<T extends FieldValues>({
    control,
    name,
    label,
    itens,
    placeholder = "Selecione",
    dica,
    isRequired,
    isDisabled,
    size = "md",
    className,
}: {
    control: Control<T>;
    name: FieldPath<T>;
    label?: string;
    itens: SelectItemType[];
    placeholder?: string;
    dica?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    size?: "sm" | "md";
    className?: string;
}) {
    const { field, fieldState } = useController({ control, name });
    return (
        <Select
            label={label}
            aria-label={label ? undefined : placeholder}
            items={itens}
            placeholder={placeholder}
            size={size}
            className={className}
            isRequired={isRequired}
            isDisabled={isDisabled}
            selectedKey={(field.value as string | null | undefined) ?? null}
            onSelectionChange={(chave) => field.onChange(chave === null ? "" : String(chave))}
            onBlur={field.onBlur}
            isInvalid={Boolean(fieldState.error)}
            hint={fieldState.error?.message ?? dica}
        >
            {(item) => <Select.Item id={item.id} label={item.label} supportingText={item.supportingText} />}
        </Select>
    );
}
