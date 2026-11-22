import type { NextConfig } from "next";

/**
 * A SPA chama a API pelo mesmo domínio (`/api`), e o Next encaminha as requisições ao backend.
 * Assim o cookie de sessão HttpOnly/SameSite=Lax da ADR-006 é enviado sem configuração de CORS.
 */
const destinoApi = process.env.API_PROXY_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    async rewrites() {
        return [{ source: "/api/:caminho*", destination: `${destinoApi}/api/:caminho*` }];
    },
};

export default nextConfig;
