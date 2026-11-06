import { z } from "zod";
import { messages } from "@/i18n/messages";
import { parseDecimal } from "@/lib/decimal";
import { toIsoDate } from "@/lib/format";

const v = messages.validation;

function hasAtMostDecimals(value: number, decimals: number) {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

/** The server stays the authority; these limits mirror it for fast feedback (and so the value fits the column). */
function decimalField(max: number, decimals: number, maxMessage: string) {
  return z
    .string()
    .trim()
    .min(1, v.required)
    .transform((text, ctx) => {
      const value = parseDecimal(text);
      const problem =
        value === null ? v.decimalInvalid
        : value < 0.01 ? v.min
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

const priceFields = {
  packagePrice: decimalField(99_999.99, 2, v.priceMax),
  packageQuantity: decimalField(999_999.9999, 4, v.quantityMax),
  purchasedOn: z
    .string()
    .min(1, v.required)
    .refine((date) => date <= toIsoDate(new Date()), v.dateFuture),
};

const name = z.string().trim().min(1, v.required).max(120, v.textTooLong);
const brandSupplier = z.string().trim().max(120, v.textTooLong);
const categoryId = z.string().min(1, v.categoryRequired);

export const createSchema = z.object({
  name,
  brandSupplier,
  categoryId,
  baseUnit: z.enum(["GRAM", "MILLILITER", "UNIT"]),
  ...priceFields,
});
export const editSchema = z.object({ name, brandSupplier, categoryId });
export const priceSchema = z.object(priceFields);

export type CreateFormInput = z.input<typeof createSchema>;
export type CreateFormValues = z.output<typeof createSchema>;
export type EditFormInput = z.input<typeof editSchema>;
export type EditFormValues = z.output<typeof editSchema>;
export type PriceFormInput = z.input<typeof priceSchema>;
export type PriceFormValues = z.output<typeof priceSchema>;