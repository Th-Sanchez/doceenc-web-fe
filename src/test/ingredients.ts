import { http, HttpResponse } from "msw";
import type { Category, Ingredient } from "@/api/types";
import { API } from "./api";
import { server } from "./server";

export function ingredientFixture(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "ing-1",
    name: "Farinha de trigo",
    brandSupplier: null,
    category: { id: "cat-1", name: "Farinhas" },
    baseUnit: "GRAM",
    packagePrice: 5.2,
    packageQuantity: 1000,
    unitPrice: 0.0052,
    lastPurchasedOn: "2026-10-18",
    variationPercent: null,
    active: true,
    ...overrides,
  };
}

export const categoryFixture = (overrides: Partial<Category> = {}): Category => ({
  id: "cat-1",
  name: "Farinhas",
  type: "INGREDIENT",
  ...overrides,
});

export function mockIngredients(list: Ingredient[]) {
  server.use(http.get(`${API}/api/v1/ingredients`, () => HttpResponse.json(list)));
}

export function mockCategories(list: Category[]) {
  server.use(http.get(`${API}/api/v1/categories`, () => HttpResponse.json(list)));
}