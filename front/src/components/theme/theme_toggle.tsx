import { Moon01, Sun } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { useTheme } from "@/providers/theme-provider";

function modoEscuroAtivo(): boolean {
    return document.documentElement.classList.contains("dark-mode");
}

/** Alterna entre os modos claro e escuro (padrão: o do sistema). */
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const escuro = theme === "dark" || (theme === "system" && modoEscuroAtivo());
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
