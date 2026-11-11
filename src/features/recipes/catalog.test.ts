import { describe, expect, it } from "vitest";
import type { RecipeSummary } from "@/api/types";
import { categoryChips, filterRecipes, recipesByStatus, sortRecipes } from "./catalog";

function recipe(overrides: Partial<RecipeSummary> = {}): RecipeSummary {
  return {
    id: "r1",
    name: "Brigadeiro",
    category: { id: "c1", name: "Doces" },
    yieldQuantity: 40,
    yieldUnit: "UNIT",
    prepTimeMinutes: null,
    shelfLifeDays: null,
    active: true,
    itemCount: 3,
    archivedIngredientCount: 0,
    totalCost: 10,
    costPerYieldUnit: 0.25,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T10:00:00Z",
    ...overrides,
  };
}

const names = (items: RecipeSummary[]) => items.map((item) => item.name);

describe("recipesByStatus", () => {
  const all = [recipe({ id: "1", name: "A" }), recipe({ id: "2", name: "B", active: false })];

  it("keeps only the requested status", () => {
    expect(names(recipesByStatus(all, "active"))).toEqual(["A"]);
    expect(names(recipesByStatus(all, "archived"))).toEqual(["B"]);
  });

  it("makes the category chips follow the status", () => {
    const archivedOnly = recipesByStatus(
      [...all, recipe({ id: "3", name: "C", active: false, category: { id: "c2", name: "Bolos" } })],
      "archived",
    );
    expect(categoryChips(archivedOnly)).toEqual([
      { id: "c2", name: "Bolos", count: 1 },
      { id: "c1", name: "Doces", count: 1 },
    ]);
  });
});

describe("filterRecipes", () => {
  const items = [
    recipe({ id: "1", name: "Brigadeiro" }),
    recipe({ id: "2", name: "Torta de Maçã", category: { id: "c2", name: "Tortas" } }),
  ];

  it("searches by name ignoring case and accents", () => {
    expect(names(filterRecipes(items, { search: "maca", categoryId: null }))).toEqual(["Torta de Maçã"]);
    expect(names(filterRecipes(items, { search: "  BRIG ", categoryId: null }))).toEqual(["Brigadeiro"]);
  });

  it("combines search and category", () => {
    expect(filterRecipes(items, { search: "brig", categoryId: "c2" })).toEqual([]);
    expect(names(filterRecipes(items, { search: "", categoryId: "c2" }))).toEqual(["Torta de Maçã"]);
  });
});

describe("sortRecipes", () => {
  const items = [
    recipe({ id: "1", name: "Bolo", totalCost: 50, costPerYieldUnit: 2, updatedAt: "2026-11-02T10:00:00.5Z" }),
    recipe({ id: "2", name: "açaí", totalCost: 80, costPerYieldUnit: 1, updatedAt: "2026-11-03T10:00:00Z" }),
    recipe({ id: "3", name: "Torta", totalCost: 80, costPerYieldUnit: 3, updatedAt: "2026-11-01T10:00:00Z" }),
  ];

  it("sorts by name ignoring accents and case", () => {
    expect(names(sortRecipes(items, "name"))).toEqual(["açaí", "Bolo", "Torta"]);
  });

  it("puts the most expensive first, breaking ties by name", () => {
    expect(names(sortRecipes(items, "cost"))).toEqual(["açaí", "Torta", "Bolo"]);
    expect(names(sortRecipes(items, "unitCost"))).toEqual(["Torta", "Bolo", "açaí"]);
  });

  it("puts the most recently updated first", () => {
    expect(names(sortRecipes(items, "recent"))).toEqual(["açaí", "Bolo", "Torta"]);
  });

  it("does not mutate the input", () => {
    const copy = [...items];
    sortRecipes(items, "cost");
    expect(items).toEqual(copy);
  });
});