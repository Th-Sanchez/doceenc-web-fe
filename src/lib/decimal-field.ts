import { z } from "zod";
import { messages } from "@/i18n/messages";
import { parseDecimal } from "@/lib/decimal";

const v = messages.validation;

export interface DecimalFieldOptions {
  min: number;
  max: number;
  decimals: number;
  minMessage: string;
  maxMessage: string;
}

/**
 * Compares the number with its own rounding instead of multiplying by a power of ten:
 * the multiplication loses precision on large values and rejects valid input.
 */
function hasAtMostDecimals(value: number, decimals: number) {
  return Number(value.toFixed(decimals)) === value;
}

/**
 * Text input (pt-BR, "1,5") turned into a number. The server stays the authority; these limits
 * mirror it for fast feedback (and so the value fits the column).
 */
export function decimalField({ min, max, decimals, minMessage, maxMessage }: DecimalFieldOptions) {
  return z
    .string()
    .trim()
    .min(1, v.required)
    .transform((text, ctx) => {
      const value = parseDecimal(text);
      const problem =
        value === null ? v.decimalInvalid
        : value < min ? minMessage
        : value > max ? maxMessage
        : !hasAtMostDecimals(value, decimals) ? v.decimals(decimals)
        : null;
      if (problem !== null || value === null) {
        ctx.addIssue({ code: "custom", message: problem ?? v.decimalInvalid });
        return z.NEVER;
      }
      return value;
    });
}