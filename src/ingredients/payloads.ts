import type { CreateIngredientInput, PriceInput, UpdateIngredientInput } from "@/api/types";
import type { CreateFormValues, EditFormValues, PriceFormValues } from "./schemas";
import { INPUT_UNIT } from "./units";
import type { BaseUnit } from "@/api/types";

const blankToUndefined = (text: string) => (text === "" ? undefined : text);

export function toCreateBody(values: CreateFormValues): CreateIngredientInput {
  return {
    name: values.name,
    brandSupplier: blankToUndefined(values.brandSupplier),
    categoryId: values.categoryId,
    baseUnit: values.baseUnit,
    price: toPriceBody(values, values.baseUnit),
  };
}

export function toUpdateBody(values: EditFormValues): UpdateIngredientInput {
  return {
    name: values.name,
    brandSupplier: blankToUndefined(values.brandSupplier),
    categoryId: values.categoryId,
  };
}

export function toPriceBody(values: PriceFormValues, baseUnit: BaseUnit): PriceInput {
  return {
    packagePrice: values.packagePrice,
    packageQuantity: values.packageQuantity,
    unit: INPUT_UNIT[baseUnit],
    purchasedOn: values.purchasedOn,
  };
}