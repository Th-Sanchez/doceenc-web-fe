import { describe, expect, it } from "vitest";
import type { Ingredient } from "@/api/types";
import {
  availableIngredients, countByCategory, filterIngredients, paginate, sortIngredients,
} from "./catalog";

function ingredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: crypto.randomUUID(),
    name: "Farinha de trigo",
    brandSupplier: null,
    category: { id: "flours", name: "Farinhas" },
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

const names = (items: Ingredient[]) => items.map((item) => item.name);

describe("filtering", () => {
  const items = [
    ingredient({ name: "Açúcar refinado" }),
    ingredient({ name: "Leite condensado", brandSupplier: "Moça", category: { id: "dairy", name: "Laticínios" } }),
    ingredient({ name: "Farinha de trigo", brandSupplier: "Dona Benta" }),
  ];

  it("searches name and brand ignoring case and accents", () => {
    expect(names(filterIngredients(items, { search: "acucar", categoryId: null }))).toEqual(["Açúcar refinado"]);
    expect(names(filterIngredients(items, { search: " MOCA ", categoryId: null }))).toEqual(["Leite condensado"]);
    expect(filterIngredients(items, { search: "", categoryId: null })).toHaveLength(3);
  });

  it("combines search with the selected category", () => {
    expect(filterIngredients(items, { search: "a", categoryId: "dairy" })).toHaveLength(1);
    expect(filterIngredients(items, { search: "acucar", categoryId: "dairy" })).toHaveLength(0);
  });

  it("hides archived ingredients unless asked, and counts per category follow that", () => {
    const withArchived = [...items, ingredient({ name: "Cacau", active: false })];

    expect(availableIngredients(withArchived, false)).toHaveLength(3);
    expect(availableIngredients(withArchived, true)).toHaveLength(4);
    
    const chips = (items: Ingredient[]) =>
    categoryChips(items).map(({ name, count }) => [name, count]);

    expect(chips(availableIngredients(withArchived, false))).toEqual([["Farinhas", 2], ["Laticínios", 1]]);
    expect(chips(availableIngredients(withArchived, true))).toEqual([["Farinhas", 3], ["Laticínios", 1]]);
  });
});

describe("sorting", () => {
  it("sorts by name ignoring case and accents", () => {
    const sorted = sortIngredients(
      [ingredient({ name: "leite" }), ingredient({ name: "Açúcar" }), ingredient({ name: "Amido" })],
      "name",
    );
    expect(names(sorted)).toEqual(["Açúcar", "Amido", "leite"]);
  });

  it("puts the biggest increase first and ingredients without variation last", () => {
    const sorted = sortIngredients(
      [
        ingredient({ name: "B", variationPercent: null }),
        ingredient({ name: "C", variationPercent: -3 }),
        ingredient({ name: "A", variationPercent: 12.5 }),
        ingredient({ name: "D", variationPercent: 8 }),
      ],
      "variation",
    );
    expect(names(sorted)).toEqual(["A", "D", "C", "B"]);
  });

  it("puts the most recent purchase first, breaking ties by name", () => {
    const sorted = sortIngredients(
      [
        ingredient({ name: "B", lastPurchasedOn: "2026-10-01" }),
        ingredient({ name: "C", lastPurchasedOn: "2026-10-20" }),
        ingredient({ name: "A", lastPurchasedOn: "2026-10-20" }),
      ],
      "recent",
    );
    expect(names(sorted)).toEqual(["A", "C", "B"]);
  });

  it("does not mutate its input", () => {
    const input = [ingredient({ name: "B" }), ingredient({ name: "A" })];
    sortIngredients(input, "name");
    expect(names(input)).toEqual(["B", "A"]);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 14 }, (_, i) => i + 1);

  it("slices a page and reports the totals", () => {
    expect(paginate(items, 2, 6)).toEqual({ items: [7, 8, 9, 10, 11, 12], page: 2, pageCount: 3, total: 14 });
  });

  it("clamps out-of-range pages and handles empty lists", () => {
    expect(paginate(items, 99, 6).page).toBe(3);
    expect(paginate(items, 0, 6).page).toBe(1);
    expect(paginate([], 1, 6)).toEqual({ items: [], page: 1, pageCount: 1, total: 0 });
  });
});