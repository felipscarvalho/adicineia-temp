import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app_shell";

/** Route group da área logada (telas T01–T07). */
export default function LayoutAreaLogada({ children }: { children: ReactNode }) {
    return <AppShell>{children}</AppShell>;
}
