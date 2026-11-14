import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { settingsSchema } from "./schemas";

const v = messages.validation;
const range = messages.settings.validation.marginRange;

function messageOf(input: Record<string, string>, field: string) {
  const result = settingsSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("settingsSchema", () => {
  it("reads both margins in pt-BR", () => {
    const result = settingsSchema.safeParse({ targetMarginRetail: "42,5", targetMarginWholesale: "30" });

    expect(result.data).toEqual({ targetMarginRetail: 42.5, targetMarginWholesale: 30 });
  });

  it("accepts the boundaries 0 and 99,99", () => {
    const result = settingsSchema.safeParse({ targetMarginRetail: "0", targetMarginWholesale: "99,99" });

    expect(result.data).toEqual({ targetMarginRetail: 0, targetMarginWholesale: 99.99 });
  });

  it("rejects 100 and above", () => {
    expect(messageOf({ targetMarginRetail: "100", targetMarginWholesale: "30" }, "targetMarginRetail")).toBe(range);
    expect(messageOf({ targetMarginRetail: "30", targetMarginWholesale: "250" }, "targetMarginWholesale")).toBe(range);
  });

  it("rejects more than two decimals instead of rounding", () => {
    expect(messageOf({ targetMarginRetail: "50,123", targetMarginWholesale: "30" }, "targetMarginRetail")).toBe(v.decimals(2));
  });

  it("rejects blank and unreadable values", () => {
    expect(messageOf({ targetMarginRetail: "", targetMarginWholesale: "30" }, "targetMarginRetail")).toBe(v.required);
    expect(messageOf({ targetMarginRetail: "abc", targetMarginWholesale: "30" }, "targetMarginRetail")).toBe(v.decimalInvalid);
    expect(messageOf({ targetMarginRetail: "-5", targetMarginWholesale: "30" }, "targetMarginRetail")).toBe(v.decimalInvalid);
  });
});