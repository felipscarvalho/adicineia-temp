"use client";

import { Moon01, Sun } from "@untitledui/icons";
import { useTheme } from "next-themes";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

/** Alterna entre os modos claro e escuro (padrão escuro). */
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const escuro = resolvedTheme !== "light";
    return (
        <ButtonUtility
            size="sm"
            color="tertiary"
            tooltip={escuro ? "Usar modo claro" : "Usar modo escuro"}
            icon={escuro ? Sun : Moon01}
            onClick={() => setTheme(escuro ? "light" : "dark")}
        />
    );
}
