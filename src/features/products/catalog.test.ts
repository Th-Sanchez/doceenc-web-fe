import { describe, expect, it } from "vitest";
import type { ChannelPricing, MarginStatus, ProductSummary } from "@/api/types";
import {
  filterProducts,
  overallStatus,
  productsByStatus,
  sortProducts,
  statusChips,
} from "./catalog";

function channel(status: MarginStatus): ChannelPricing {
  return {
    targetMarginPercent: 50,
    status,
    price: status === "NO_PRICE" ? null : 10,
    grossProfit: status === "NO_PRICE" ? null : 5,
    marginPercent: status === "NO_PRICE" ? null : 50,
    suggestedPrice: 10,
  };
}

function product(
  name: string,
  retail: MarginStatus,
  wholesale: MarginStatus,
  overrides: Partial<ProductSummary> = {},
): ProductSummary {
  return {
    id: name,
    name,
    active: true,
    recipe: {
      id: `recipe-${name}`,
      name: `Receita de ${name}`,
      active: true,
      yieldQuantity: 10,
      yieldUnit: "UNIT",
      costPerYieldUnit: 1,
    },
    recipeQuantity: 1,
    archivedIngredientCount: 0,
    cost: { recipeCost: 1, extrasCost: 0, totalCost: 1 },
    retail: channel(retail),
    wholesale: channel(wholesale),
    ...overrides,
  };
}

describe("overallStatus", () => {
  it("takes the worst of the channels that have a price", () => {
    expect(overallStatus(product("a", "ON_TARGET", "BELOW_TARGET"))).toBe("BELOW_TARGET");
    expect(overallStatus(product("a", "BELOW_TARGET", "LOSS"))).toBe("LOSS");
    expect(overallStatus(product("a", "ON_TARGET", "ON_TARGET"))).toBe("ON_TARGET");
  });

  it("ignores a channel without a price when the other one is priced", () => {
    expect(overallStatus(product("a", "ON_TARGET", "NO_PRICE"))).toBe("ON_TARGET");
    expect(overallStatus(product("a", "NO_PRICE", "LOSS"))).toBe("LOSS");
  });

  it("is NO_PRICE only when nothing is priced", () => {
    expect(overallStatus(product("a", "NO_PRICE", "NO_PRICE"))).toBe("NO_PRICE");
  });
});

describe("productsByStatus", () => {
  it("splits active from archived", () => {
    const all = [product("a", "ON_TARGET", "NO_PRICE"), product("b", "ON_TARGET", "NO_PRICE", { active: false })];

    expect(productsByStatus(all, "active").map((p) => p.name)).toEqual(["a"]);
    expect(productsByStatus(all, "archived").map((p) => p.name)).toEqual(["b"]);
  });
});

describe("filterProducts", () => {
  const items = [
    product("Brigadeiro", "ON_TARGET", "NO_PRICE"),
    product("Bolo de pote", "LOSS", "NO_PRICE"),
    product("Brownie", "BELOW_TARGET", "NO_PRICE", { recipe: { ...product("x", "ON_TARGET", "NO_PRICE").recipe, name: "Fatia selada" } }),
  ];

  it("searches the product name ignoring case", () => {
    expect(filterProducts(items, { search: "BRIGADEIRO", status: null }).map((p) => p.name)).toEqual(["Brigadeiro"]);
    expect(filterProducts(items, { search: "de pote", status: null }).map((p) => p.name)).toEqual(["Bolo de pote"]);
  });

  it("also searches the recipe name", () => {
    expect(filterProducts(items, { search: "selada", status: null }).map((p) => p.name)).toEqual(["Brownie"]);
  });

  it("filters by the overall status", () => {
    expect(filterProducts(items, { search: "", status: "LOSS" }).map((p) => p.name)).toEqual(["Bolo de pote"]);
  });

  it("combines search and status", () => {
    expect(filterProducts(items, { search: "bro", status: "LOSS" })).toEqual([]);
  });
});

describe("statusChips", () => {
  it("lists only the statuses that exist, most urgent first, and the counts add up", () => {
    const items = [
      product("a", "ON_TARGET", "ON_TARGET"),
      product("b", "LOSS", "ON_TARGET"),
      product("c", "ON_TARGET", "BELOW_TARGET"),
      product("d", "ON_TARGET", "NO_PRICE"),
      product("e", "NO_PRICE", "NO_PRICE"),
    ];

    const chips = statusChips(items);

    expect(chips).toEqual([
      { status: "LOSS", count: 1 },
      { status: "BELOW_TARGET", count: 1 },
      { status: "NO_PRICE", count: 1 },
      { status: "ON_TARGET", count: 2 },
    ]);
    expect(chips.reduce((sum, chip) => sum + chip.count, 0)).toBe(items.length);
  });

  it("is empty for an empty list", () => {
    expect(statusChips([])).toEqual([]);
  });
});

describe("sortProducts", () => {
  const items = [
    product("Cento", "ON_TARGET", "ON_TARGET", { cost: { recipeCost: 72, extrasCost: 0, totalCost: 72 } }),
    product("acai", "LOSS", "NO_PRICE", { cost: { recipeCost: 3, extrasCost: 0, totalCost: 3 } }),
    product("Brownie", "BELOW_TARGET", "NO_PRICE", { cost: { recipeCost: 3.4, extrasCost: 0, totalCost: 3.4 } }),
    product("Bolo", "BELOW_TARGET", "NO_PRICE", { cost: { recipeCost: 7.5, extrasCost: 0, totalCost: 7.5 } }),
  ];

  it("by name ignoring case", () => {
    expect(sortProducts(items, "name").map((p) => p.name)).toEqual(["acai", "Bolo", "Brownie", "Cento"]);
  });

  it("by attention: losses first, then below target, ties by name", () => {
    expect(sortProducts(items, "attention").map((p) => p.name)).toEqual(["acai", "Bolo", "Brownie", "Cento"]);
  });

  it("by cost, most expensive first", () => {
    expect(sortProducts(items, "cost").map((p) => p.name)).toEqual(["Cento", "Bolo", "Brownie", "acai"]);
  });

  it("does not change the list it receives", () => {
    const copy = [...items];
    sortProducts(items, "cost");
    expect(items).toEqual(copy);
  });
});