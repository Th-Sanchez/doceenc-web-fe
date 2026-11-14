import { http, HttpResponse } from "msw";
import type {
  ChannelPricing,
  Product,
  ProductSimulation,
  ProductSummary,
  SimulateProductInput,
} from "@/api/types";
import { API } from "./api";
import { server } from "./server";

export function channelFixture(overrides: Partial<ChannelPricing> = {}): ChannelPricing {
  return {
    targetMarginPercent: 50,
    status: "ON_TARGET",
    price: 15,
    grossProfit: 7.5,
    marginPercent: 50,
    suggestedPrice: 15,
    ...overrides,
  };
}

/** A channel with no price yet: only the target, the status and the suggestion are filled. */
export function noPriceFixture(overrides: Partial<ChannelPricing> = {}): ChannelPricing {
  return channelFixture({
    targetMarginPercent: 35,
    status: "NO_PRICE",
    price: null,
    grossProfit: null,
    marginPercent: null,
    suggestedPrice: 11.54,
    ...overrides,
  });
}

const recipeRef = {
  id: "rec-1",
  name: "Bolo de pote",
  active: true,
  yieldQuantity: 10,
  yieldUnit: "UNIT" as const,
  costPerYieldUnit: 6.8,
};

export function productSummaryFixture(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: "prod-1",
    name: "Bolo de pote Ninho",
    active: true,
    recipe: recipeRef,
    recipeQuantity: 1,
    archivedIngredientCount: 0,
    cost: { recipeCost: 6.8, extrasCost: 0.7, totalCost: 7.5 },
    retail: channelFixture(),
    wholesale: noPriceFixture(),
    ...overrides,
  };
}

export function productFixture(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Bolo de pote Ninho",
    active: true,
    recipe: recipeRef,
    recipeQuantity: 1,
    items: [],
    archivedIngredientCount: 0,
    cost: { recipeCost: 6.8, extrasCost: 0, totalCost: 6.8 },
    retail: channelFixture({ price: 11, grossProfit: 4.2, marginPercent: 38.18, status: "BELOW_TARGET", suggestedPrice: 13.6 }),
    wholesale: noPriceFixture(),
    createdAt: "2026-11-10T10:00:00Z",
    updatedAt: "2026-11-10T10:00:00Z",
    ...overrides,
  };
}

export function productSimulationFixture(overrides: Partial<ProductSimulation> = {}): ProductSimulation {
  return {
    recipe: recipeRef,
    items: [],
    cost: { recipeCost: 6.8, extrasCost: 0.7, totalCost: 7.5 },
    retail: noPriceFixture({ targetMarginPercent: 50, suggestedPrice: 15 }),
    wholesale: noPriceFixture(),
    ...overrides,
  };
}

export function mockProducts(list: ProductSummary[]) {
  server.use(http.get(`${API}/api/v1/products`, () => HttpResponse.json(list)));
}

export function mockProduct(product: Product) {
  server.use(http.get(`${API}/api/v1/products/${product.id}`, () => HttpResponse.json(product)));
}

/** Answers every simulation with `build(body)` and returns the list of bodies it received. */
export function mockProductSimulation(
  build: (body: SimulateProductInput) => ProductSimulation = () => productSimulationFixture(),
) {
  const calls: SimulateProductInput[] = [];
  server.use(
    http.post(`${API}/api/v1/products/simulation`, async ({ request }) => {
      const body = (await request.json()) as SimulateProductInput;
      calls.push(body);
      return HttpResponse.json(build(body));
    }),
  );
  return calls;
}