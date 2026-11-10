import { z } from "zod";
import { messages } from "@/i18n/messages";
import { decimalField } from "@/lib/decimal-field";

const v = messages.validation;

const name = z.string().trim().min(1, v.required).max(120, v.textTooLong);
const categoryId = z.string().min(1, v.categoryRequired);

/** Used for the yield and for every line; 4 decimals and the same ceiling as the ingredient package. */
const quantity = decimalField({
  min: 0.0001,
  max: 999_999.9999,
  decimals: 4,
  minMessage: v.quantityMin,
  maxMessage: v.quantityMax,
});

const MAX_INTEGER = 99_999;

/** Optional whole number typed as text: blank becomes null. */
const optionalInteger = z
  .string()
  .trim()
  .transform((text, ctx) => {
    if (text === "") return null;
    const value = /^\d+$/.test(text) ? Number(text) : null;
    const problem =
      value === null ? v.integerInvalid
      : value < 1 ? v.integerMin
      : value > MAX_INTEGER ? v.integerMax(MAX_INTEGER)
      : null;
    if (problem !== null || value === null) {
      ctx.addIssue({ code: "custom", message: problem ?? v.integerInvalid });
      return z.NEVER;
    }
    return value;
  });

const item = z.object({ ingredientId: z.string().min(1, v.required), quantity });

const hasUniqueIngredients = (lines: { ingredientId: string }[]) =>
  new Set(lines.map((line) => line.ingredientId)).size === lines.length;

const items = z.array(item).min(1, v.itemsRequired).refine(hasUniqueIngredients, v.duplicateItem);

export const createSchema = z.object({
  name,
  categoryId,
  yieldQuantity: quantity,
  yieldUnit: z.enum(["GRAM", "MILLILITER", "UNIT"]),
  prepTimeMinutes: optionalInteger,
  shelfLifeDays: optionalInteger,
  items,
});

/** The yield unit is immutable once the recipe exists. */
export const editSchema = createSchema.omit({ yieldUnit: true });

/**
 * What the live cost needs: it may run with no lines yet (the server answers zeros) but never
 * with a half filled one, so an incomplete form simply yields no request.
 */
export const simulationSchema = z.object({
  yieldQuantity: quantity,
  items: z.array(item).refine(hasUniqueIngredients, v.duplicateItem),
});

export type CreateRecipeFormInput = z.input<typeof createSchema>;
export type CreateRecipeFormValues = z.output<typeof createSchema>;
export type EditRecipeFormInput = z.input<typeof editSchema>;
export type EditRecipeFormValues = z.output<typeof editSchema>;
export type SimulationFormInput = z.input<typeof simulationSchema>;