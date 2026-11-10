import type { CreateRecipeInput, SimulateRecipeInput, UpdateRecipeInput } from "@/api/types";
import {
  simulationSchema,
  type CreateRecipeFormValues,
  type EditRecipeFormValues,
  type SimulationFormInput,
} from "./schemas";

// Blank optional fields travel as absent: a PUT replaces the whole recipe, so absent clears them.
const absentIfNull = (value: number | null) => value ?? undefined;

export function toCreateBody(values: CreateRecipeFormValues): CreateRecipeInput {
  return {
    name: values.name,
    categoryId: values.categoryId,
    yieldQuantity: values.yieldQuantity,
    yieldUnit: values.yieldUnit,
    prepTimeMinutes: absentIfNull(values.prepTimeMinutes),
    shelfLifeDays: absentIfNull(values.shelfLifeDays),
    items: values.items,
  };
}

export function toUpdateBody(values: EditRecipeFormValues): UpdateRecipeInput {
  return {
    name: values.name,
    categoryId: values.categoryId,
    yieldQuantity: values.yieldQuantity,
    prepTimeMinutes: absentIfNull(values.prepTimeMinutes),
    shelfLifeDays: absentIfNull(values.shelfLifeDays),
    items: values.items,
  };
}

/** Null while the form cannot be priced yet: the caller then makes no request. */
export function toSimulationBody(raw: SimulationFormInput): SimulateRecipeInput | null {
  const parsed = simulationSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}