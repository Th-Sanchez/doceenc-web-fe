import type { CreateProductInput, SimulateProductInput, UpdateProductInput } from "@/api/types";
import { type ProductFormValues, type SimulationFormInput, simulationSchema } from "./schemas";

// A blank price travels as absent: a PUT replaces the whole product, so absent clears it.
const absentIfNull = (value: number | null) => value ?? undefined;

export function toCreateBody(values: ProductFormValues): CreateProductInput {
  return {
    name: values.name,
    recipeId: values.recipeId,
    recipeQuantity: values.recipeQuantity,
    retailPrice: absentIfNull(values.retailPrice),
    wholesalePrice: absentIfNull(values.wholesalePrice),
    items: values.items,
  };
}

export function toUpdateBody(values: ProductFormValues): UpdateProductInput {
  return toCreateBody(values);
}

/** Null while the form cannot be priced yet: the caller then makes no request. */
export function toSimulationBody(raw: SimulationFormInput): SimulateProductInput | null {
  const parsed = simulationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { recipeId, recipeQuantity, retailPrice, wholesalePrice, items } = parsed.data;
  return {
    recipeId,
    recipeQuantity,
    retailPrice: absentIfNull(retailPrice),
    wholesalePrice: absentIfNull(wholesalePrice),
    items,
  };
}