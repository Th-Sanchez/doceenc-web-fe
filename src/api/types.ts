import type { components } from "./schema";

export type Ingredient = components["schemas"]["IngredientResponse"];
export type PriceHistoryEntry = components["schemas"]["PriceHistoryResponse"];
export type Category = components["schemas"]["CategoryResponse"];
export type BaseUnit = NonNullable<Ingredient["baseUnit"]>;
export type CreateIngredientInput = components["schemas"]["CreateIngredientRequest"];
export type UpdateIngredientInput = components["schemas"]["UpdateIngredientRequest"];
export type PriceInput = components["schemas"]["PriceRequest"];
export type Recipe = components["schemas"]["RecipeDetailResponse"];
export type RecipeSummary = components["schemas"]["RecipeSummaryResponse"];
export type CreateRecipeInput = components["schemas"]["CreateRecipeRequest"];
export type UpdateRecipeInput = components["schemas"]["UpdateRecipeRequest"];
export type SimulateRecipeInput = components["schemas"]["SimulateRecipeRequest"];
export type RecipeSimulation = components["schemas"]["RecipeSimulationResponse"];