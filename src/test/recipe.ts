import { http, HttpResponse } from "msw";
import type { Recipe, RecipeSimulation, RecipeSummary, SimulateRecipeInput } from "@/api/types";
import { API } from "./api";
import { server } from "./server";

export function recipeSummaryFixture(overrides: Partial<RecipeSummary> = {}): RecipeSummary {
  return {
    id: "rec-1",
    name: "Brigadeiro",
    category: { id: "cat-r1", name: "Doces" },
    yieldQuantity: 40,
    yieldUnit: "UNIT",
    prepTimeMinutes: 45,
    shelfLifeDays: 5,
    active: true,
    itemCount: 3,
    archivedIngredientCount: 0,
    totalCost: 11.8,
    costPerYieldUnit: 0.25,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

export function recipeFixture(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: "rec-1",
    name: "Brigadeiro",
    category: { id: "cat-r1", name: "Doces" },
    yieldQuantity: 40,
    yieldUnit: "UNIT",
    prepTimeMinutes: 45,
    shelfLifeDays: 5,
    active: true,
    items: [
      {
        ingredient: {
          id: "ing-1",
          name: "Leite condensado",
          brandSupplier: "Moça",
          baseUnit: "GRAM",
          active: true,
          unitPrice: 0.02,
        },
        quantity: 395,
        cost: 7.9,
      },
    ],
    totalCost: 7.9,
    costPerYieldUnit: 0.1975,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

export function mockRecipes(list: RecipeSummary[]) {
  server.use(http.get(`${API}/api/v1/recipes`, () => HttpResponse.json(list)));
}

export function mockRecipe(recipe: Recipe) {
  server.use(http.get(`${API}/api/v1/recipes/${recipe.id}`, () => HttpResponse.json(recipe)));
}

export function simulationFixture(overrides: Partial<RecipeSimulation> = {}): RecipeSimulation {
  return {
    items: [
      {
        ingredient: {
          id: "ing-1",
          name: "Leite condensado",
          brandSupplier: "Moça",
          baseUnit: "GRAM",
          active: true,
          unitPrice: 0.02,
        },
        quantity: 395,
        cost: 7.9,
      },
    ],
    totalCost: 7.9,
    costPerYieldUnit: 0.1975,
    ...overrides,
  };
}

/** Answers every simulation with `build(body)` and returns the list of bodies it received. */
export function mockSimulation(build: (body: SimulateRecipeInput) => RecipeSimulation = () => simulationFixture()) {
  const calls: SimulateRecipeInput[] = [];
  server.use(
    http.post(`${API}/api/v1/recipes/simulation`, async ({ request }) => {
      const body = (await request.json()) as SimulateRecipeInput;
      calls.push(body);
      return HttpResponse.json(build(body));
    }),
  );
  return calls;
}