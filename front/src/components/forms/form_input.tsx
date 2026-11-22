"use client";

import type { ComponentProps } from "react";
import { type Control, type FieldPath, type FieldValues, useController } from "react-hook-form";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";

type PropsInput = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "onBlur" | "name" | "isInvalid" | "hint"> & { dica?: string };

/** Campo de texto ligado ao react-hook-form: o erro de validação aparece no lugar da dica. */
export function FormInput<T extends FieldValues>({ control, name, dica, ...props }: PropsInput & { control: Control<T>; name: FieldPath<T> }) {
    const {
        field: { ref, name: nomeCampo, value, onChange, onBlur },
        fieldState,
    } = useController({ control, name });
    return (
        <Input
            {...props}
            name={nomeCampo}
            ref={ref}
            value={(value as string | number | undefined)?.toString() ?? ""}
            onChange={onChange}
            onBlur={onBlur}
            isInvalid={Boolean(fieldState.error)}
            hint={fieldState.error?.message ?? dica}
            inputClassName={props.inputClassName ?? "glass-field"}
        />
    );
}

type PropsTextArea = Omit<ComponentProps<typeof TextArea>, "value" | "onChange" | "onBlur" | "name" | "isInvalid" | "hint"> & { dica?: string };

export function FormTextArea<T extends FieldValues>({ control, name, dica, ...props }: PropsTextArea & { control: Control<T>; name: FieldPath<T> }) {
    const { field, fieldState } = useController({ control, name });
    return (
        <TextArea
            {...props}
            name={field.name}
            value={(field.value as string | undefined) ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            isInvalid={Boolean(fieldState.error)}
            hint={fieldState.error?.message ?? dica}
        />
    );
}
