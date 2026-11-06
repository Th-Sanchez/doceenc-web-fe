import type { components } from "./schema";

export type Ingredient = components["schemas"]["IngredientResponse"];
export type PriceHistoryEntry = components["schemas"]["PriceHistoryResponse"];
export type Category = components["schemas"]["CategoryResponse"];
export type BaseUnit = NonNullable<Ingredient["baseUnit"]>;
export type CreateIngredientInput = components["schemas"]["CreateIngredientRequest"];
export type UpdateIngredientInput = components["schemas"]["UpdateIngredientRequest"];
export type PriceInput = components["schemas"]["PriceRequest"];