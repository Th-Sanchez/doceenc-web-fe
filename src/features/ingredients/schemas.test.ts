import { describe, expect, it } from "vitest";
import { toIsoDate } from "@/lib/format";
import { createSchema } from "./schemas";

const valid = {
  name: "  Farinha de trigo ",
  brandSupplier: "",
  categoryId: "cat-1",
  baseUnit: "GRAM" as const,
  packagePrice: "5,20",
  packageQuantity: "1.000",
  purchasedOn: "2026-10-01",
};

const failedFields = (input: object) => {
  const result = createSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path[0]);
};

describe("createSchema", () => {
  it("trims text and parses pt-BR decimals into numbers", () => {
    const result = createSchema.safeParse(valid);

    expect(result.success && result.data).toMatchObject({
      name: "Farinha de trigo",
      packagePrice: 5.2,
      packageQuantity: 1000,
    });
  });

  it.each([
    ["packagePrice", ""],
    ["packagePrice", "abc"],
    ["packagePrice", "0"],
    ["packagePrice", "5,999"],
    ["packagePrice", "100.000,00"],
    ["packageQuantity", "0,001"],
    ["packageQuantity", "1.000.000"],
    ["packageQuantity", "1,23456"],
  ])("rejects %s = %j", (field, value) => {
    expect(failedFields({ ...valid, [field]: value })).toContain(field);
  });

  it("rejects a missing category and a purchase date in the future", () => {
    const future = toIsoDate(new Date(Date.now() + 2 * 86_400_000));

    expect(failedFields({ ...valid, categoryId: "" })).toContain("categoryId");
    expect(failedFields({ ...valid, purchasedOn: future })).toContain("purchasedOn");
  });
});