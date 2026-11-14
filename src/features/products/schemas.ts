import { z } from "zod";
import { messages } from "@/i18n/messages";
import { decimalField } from "@/lib/decimal-field";

const v = messages.validation;
const pv = messages.productForm.validation;

const name = z.string().trim().min(1, v.required).max(120, v.textTooLong);
const recipeId = z.string().min(1, pv.recipeRequired);

/** Used for the recipe quantity and for every extra item; 4 decimals, like the recipe lines. */
const quantity = decimalField({
  min: 0.0001,
  max: 999_999.9999,
  decimals: 4,
  minMessage: v.quantityMin,
  maxMessage: v.quantityMax,
});

/** Selling price: cents, and never zero (a product is either priced or not priced). */
const price = decimalField({
  min: 0.01,
  max: 99_999_999.99,
  decimals: 2,
  minMessage: pv.priceMin,
  maxMessage: pv.priceMax,
});

/** A blank price means "not set yet" and travels as absent. */
const optionalPrice = z
  .string()
  .trim()
  .transform((text, ctx) => {
    if (text === "") return null;
    const parsed = price.safeParse(text);
    if (parsed.success) return parsed.data;
    ctx.addIssue({ code: "custom", message: parsed.error.issues[0]?.message ?? v.decimalInvalid });
    return z.NEVER;
  });

const item = z.object({ ingredientId: z.string().min(1, v.required), quantity });

const hasUniqueIngredients = (lines: { ingredientId: string }[]) =>
  new Set(lines.map((line) => line.ingredientId)).size === lines.length;

/** Unlike a recipe, a product may have no extra items at all. */
const items = z.array(item).refine(hasUniqueIngredients, v.duplicateItem);

export const productSchema = z.object({
  name,
  recipeId,
  recipeQuantity: quantity,
  retailPrice: optionalPrice,
  wholesalePrice: optionalPrice,
  items,
});

/** For the live simulation an unreadable price counts as "not set": it must not hide the cost. */
const lenientPrice = z
  .string()
  .trim()
  .transform((text) => {
    const parsed = price.safeParse(text);
    return parsed.success ? parsed.data : null;
  });

/**
 * What the live numbers need. The recipe, its quantity and the extra items must be valid (a
 * half-filled row makes no request); the prices may be blank or still being typed.
 */
export const simulationSchema = z.object({
  recipeId,
  recipeQuantity: quantity,
  retailPrice: lenientPrice,
  wholesalePrice: lenientPrice,
  items,
});

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormValues = z.output<typeof productSchema>;
export type SimulationFormInput = z.input<typeof simulationSchema>;