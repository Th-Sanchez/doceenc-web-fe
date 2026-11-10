import { describe, expect, it } from "vitest";
import { formatMoney, formatUnitCost } from "@/lib/format";
import { formatMinutes, formatRecipeUnitCost } from "./format";

describe("formatMinutes", () => {
  it("keeps short times in minutes", () => {
    expect(formatMinutes(45)).toBe("45 min");
  });

  it("switches to hours from 60 minutes", () => {
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(80)).toBe("1h 20 min");
    expect(formatMinutes(130)).toBe("2h 10 min");
  });
});

describe("formatRecipeUnitCost", () => {
  it("shows per-piece cost as plain money", () => {
    expect(formatRecipeUnitCost(0.72, "UNIT")).toBe(formatMoney(0.72));
  });

  it("keeps the extra digits per gram and per ml", () => {
    expect(formatRecipeUnitCost(0.0123, "GRAM")).toBe(formatUnitCost(0.0123, "GRAM"));
    expect(formatRecipeUnitCost(0.0123, "MILLILITER")).toBe(formatUnitCost(0.0123, "MILLILITER"));
  });
});