import { z } from "zod";
import { messages } from "@/i18n/messages";
import { decimalField } from "@/lib/decimal-field";
import { toIsoDate } from "@/lib/format";

const v = messages.validation;

const priceFields = {
  packagePrice: decimalField({ min: 0.01, max: 99_999.99, decimals: 2, minMessage: v.min, maxMessage: v.priceMax }),
  packageQuantity: decimalField({ min: 0.01, max: 999_999.9999, decimals: 4, minMessage: v.min, maxMessage: v.quantityMax }),
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