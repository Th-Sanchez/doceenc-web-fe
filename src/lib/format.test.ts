// src/lib/format.test.ts
import { describe, expect, it } from "vitest";
import {
  formatDate, formatLastPurchase, formatMoney, formatQuantity, formatUnitCost,
  formatVariation, toIsoDate, variationTrend,
} from "./format";

// Intl puts a non-breaking space after "R$" and before units; compare with plain spaces.
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, " ");

describe("number formatting", () => {
  it("formats money, unit cost and quantity the way the design shows them", () => {
    expect(plain(formatMoney(7.9))).toBe("R$ 7,90");
    expect(plain(formatMoney(1482.9))).toBe("R$ 1.482,90");
    expect(plain(formatUnitCost(0.019, "GRAM"))).toBe("R$ 0,0190 / g");
    expect(plain(formatUnitCost(0.7, "UNIT"))).toBe("R$ 0,7000 / un");
    expect(plain(formatQuantity(1000, "GRAM"))).toBe("1.000 g");
    expect(plain(formatQuantity(50, "UNIT"))).toBe("50 un");
    expect(plain(formatQuantity(0.5, "MILLILITER"))).toBe("0,5 ml");
  });

  it("formats variations with an explicit sign and one decimal", () => {
    expect(formatVariation(20)).toBe("+20,0%");
    expect(formatVariation(9.09)).toBe("+9,1%");
    expect(formatVariation(-3)).toBe("-3,0%");
    expect(formatVariation(0)).toBe("0,0%");
    expect(formatVariation(0.04)).toBe("0,0%");
  });

  it("calls a variation flat exactly when it displays as zero", () => {
    expect(variationTrend(0.04)).toBe("flat");
    expect(variationTrend(0.05)).toBe("up");
    expect(variationTrend(-0.05)).toBe("down");
    expect(variationTrend(0)).toBe("flat");
  });
});

describe("date formatting", () => {
  const today = new Date(2026, 9, 25); // 25 Oct 2026

  it("labels today and yesterday and omits the year within the current year", () => {
    expect(formatLastPurchase("2026-10-25", today)).toBe("Hoje, 25/Out");
    expect(formatLastPurchase("2026-10-24", today)).toBe("Ontem, 24/Out");
    expect(formatLastPurchase("2026-10-15", today)).toBe("15/Out");
  });

  it("includes the year when it is not the current one", () => {
    expect(formatLastPurchase("2025-10-15", today)).toBe("15/Out/2025");
  });

  it("formats and converts local dates without a UTC shift", () => {
    expect(formatDate("2026-10-05")).toBe("05/10/2026");
    expect(toIsoDate(new Date(2026, 9, 5))).toBe("2026-10-05");
  });
});