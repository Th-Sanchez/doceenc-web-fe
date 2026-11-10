import { describe, expect, it } from "vitest";
import { toCreateBody, toSimulationBody, toUpdateBody } from "./payload";

const values = {
  name: "Brigadeiro",
  categoryId: "c1",
  yieldQuantity: 40,
  yieldUnit: "UNIT" as const,
  prepTimeMinutes: 30,
  shelfLifeDays: null,
  items: [{ ingredientId: "i1", quantity: 395 }],
};

describe("toCreateBody", () => {
  it("sends every field and drops the blank optionals", () => {
    const body = toCreateBody(values);
    expect(body).toEqual({
      name: "Brigadeiro",
      categoryId: "c1",
      yieldQuantity: 40,
      yieldUnit: "UNIT",
      prepTimeMinutes: 30,
      items: [{ ingredientId: "i1", quantity: 395 }],
    });
    expect(body).not.toHaveProperty("shelfLifeDays", null);
  });
});

describe("toUpdateBody", () => {
  it("never sends the yield unit", () => {
    const { yieldUnit: _ignored, ...editValues } = values;
    expect(toUpdateBody(editValues)).not.toHaveProperty("yieldUnit");
  });
});

describe("toSimulationBody", () => {
  it("builds the request once the form is complete", () => {
    expect(toSimulationBody({ yieldQuantity: "40", items: [{ ingredientId: "i1", quantity: "395" }] })).toEqual({
      yieldQuantity: 40,
      items: [{ ingredientId: "i1", quantity: 395 }],
    });
  });

  it("builds no request for an incomplete form", () => {
    expect(toSimulationBody({ yieldQuantity: "", items: [] })).toBeNull();
    expect(toSimulationBody({ yieldQuantity: "40", items: [{ ingredientId: "i1", quantity: "" }] })).toBeNull();
  });
});