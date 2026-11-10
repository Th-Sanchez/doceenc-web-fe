import { describe, expect, it } from "vitest";
import { decimalField } from "./decimal-field";

const field = decimalField({ min: 0.01, max: 100, decimals: 2, minMessage: "min", maxMessage: "max" });

describe("decimalField", () => {
  it("turns pt-BR text into a number", () => {
    expect(field.parse("12,5")).toBe(12.5);
    expect(field.parse(" 0,01 ")).toBe(0.01);
    expect(field.parse("100")).toBe(100);
  });

  it("rejects blank and non numeric text", () => {
    expect(field.safeParse("").success).toBe(false);
    expect(field.safeParse("abc").success).toBe(false);
  });

  it("applies the minimum, the maximum and the decimal limit", () => {
    const messageOf = (text: string) => {
      const result = field.safeParse(text);
      return result.success ? null : result.error.issues[0]?.message;
    };
    expect(messageOf("0")).toBe("min");
    expect(messageOf("100,01")).toBe("max");
    expect(messageOf("1,234")).not.toBeNull();
  });

  it("does not reject valid values with many digits", () => {
    const big = decimalField({ min: 0.0001, max: 999_999.9999, decimals: 4, minMessage: "min", maxMessage: "max" });
    expect(big.parse("999999,9999")).toBe(999_999.9999);
  });
});