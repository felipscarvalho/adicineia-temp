import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, MuseoModerno } from "next/font/google";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";
import { cx } from "@/utils/cx";

const museo = MuseoModerno({ subsets: ["latin"], display: "swap", variable: "--font-museo" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains" });

export const metadata: Metadata = {
    title: { default: "DataQualiSUS", template: "%s · DataQualiSUS" },
    description: "Avaliação e tratamento controlado da qualidade de datasets de saúde.",
};

export const viewport: Viewport = {
    themeColor: "#0d8a89",
    colorScheme: "dark light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className={cx(museo.variable, jetbrains.variable, "min-h-dvh bg-primary text-primary antialiased")}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
