// src/lib/decimal.test.ts
import { describe, expect, it } from "vitest";
import { parseDecimal, toInputText } from "./decimal";

describe("parseDecimal", () => {
  it.each([
    ["7,90", 7.9],
    ["7.90", 7.9],
    ["1.234,56", 1234.56],
    ["1234,56", 1234.56],
    ["1.234", 1234],
    ["1.234.567", 1234567],
    ["1.2345", 1.2345],
    ["0,5", 0.5],
    [",5", 0.5],
    ["5,", 5],
    ["R$ 7,90", 7.9],
    ["  395 ", 395],
  ])("reads %j as %d", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "-5", "1,2,3", "1.23.4", "1.2.3,4", "12,34.56", ","])(
    "rejects %j",
    (input) => {
      expect(parseDecimal(input)).toBeNull();
    },
  );
});

describe("toInputText", () => {
  it("uses a comma, no grouping and the requested minimum fraction digits", () => {
    expect(toInputText(7.9, 2)).toBe("7,90");
    expect(toInputText(395)).toBe("395");
    expect(toInputText(0.5)).toBe("0,5");
    expect(toInputText(1234.5)).toBe("1234,5");
  });
});