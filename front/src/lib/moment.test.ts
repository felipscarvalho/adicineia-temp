import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./moment";

describe("datas (lib/moment.ts)", () => {
    it("formata no padrão DD/MM/YYYY e trata ausência", () => {
        expect(formatDate("2026-11-22T12:00:00")).toBe("22/11/2026");
        expect(formatDate(null)).toBe("—");
        expect(formatDateTime("2026-11-22T09:05:03")).toBe("22/11/2026 09:05:03");
    });
});
