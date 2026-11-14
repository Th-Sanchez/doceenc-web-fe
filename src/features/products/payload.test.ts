import { describe, expect, it } from "vitest";
import { toCreateBody, toSimulationBody, toUpdateBody } from "./payload";
import type { ProductFormValues, SimulationFormInput } from "./schemas";

const values: ProductFormValues = {
  name: "Bolo de pote",
  recipeId: "recipe-1",
  recipeQuantity: 1,
  retailPrice: 11,
  wholesalePrice: null,
  items: [{ ingredientId: "ing-1", quantity: 1 }],
};

describe("toCreateBody / toUpdateBody", () => {
  it("sends the values and leaves a blank price out", () => {
    expect(toCreateBody(values)).toEqual({
      name: "Bolo de pote",
      recipeId: "recipe-1",
      recipeQuantity: 1,
      retailPrice: 11,
      wholesalePrice: undefined,
      items: [{ ingredientId: "ing-1", quantity: 1 }],
    });
  });

  it("uses the same body on update (a PUT replaces the whole product)", () => {
    expect(toUpdateBody(values)).toEqual(toCreateBody(values));
  });

  it("keeps the extra items empty when there are none", () => {
    expect(toCreateBody({ ...values, items: [] }).items).toEqual([]);
  });
});

describe("toSimulationBody", () => {
  const raw: SimulationFormInput = {
    recipeId: "recipe-1",
    recipeQuantity: "1",
    retailPrice: "11,00",
    wholesalePrice: "",
    items: [{ ingredientId: "ing-1", quantity: "1" }],
  };

  it("builds the request from the form texts", () => {
    expect(toSimulationBody(raw)).toEqual({
      recipeId: "recipe-1",
      recipeQuantity: 1,
      retailPrice: 11,
      wholesalePrice: undefined,
      items: [{ ingredientId: "ing-1", quantity: 1 }],
    });
  });

  it("is null while the form cannot be priced", () => {
    expect(toSimulationBody({ ...raw, recipeId: "" })).toBeNull();
    expect(toSimulationBody({ ...raw, recipeQuantity: "" })).toBeNull();
    expect(toSimulationBody({ ...raw, items: [{ ingredientId: "ing-1", quantity: "" }] })).toBeNull();
  });

  it("still prices while a price is half typed", () => {
    expect(toSimulationBody({ ...raw, retailPrice: "1x" })?.retailPrice).toBeUndefined();
  });
});