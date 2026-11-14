import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { productSchema, simulationSchema } from "./schemas";

const v = messages.validation;
const pv = messages.productForm.validation;

const valid = {
  name: "Bolo de pote",
  recipeId: "recipe-1",
  recipeQuantity: "1",
  retailPrice: "11,00",
  wholesalePrice: "",
  items: [{ ingredientId: "ing-1", quantity: "1" }],
};

function firstMessage(result: ReturnType<typeof productSchema.safeParse>, path: string) {
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path.join(".") === path)?.message;
}

describe("productSchema", () => {
  it("accepts a complete form and turns the texts into numbers", () => {
    const result = productSchema.safeParse(valid);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "Bolo de pote",
      recipeId: "recipe-1",
      recipeQuantity: 1,
      retailPrice: 11,
      wholesalePrice: null,
      items: [{ ingredientId: "ing-1", quantity: 1 }],
    });
  });

  it("accepts a product without extra items and without any price", () => {
    const result = productSchema.safeParse({ ...valid, retailPrice: "", items: [] });

    expect(result.success).toBe(true);
    expect(result.data?.retailPrice).toBeNull();
    expect(result.data?.items).toEqual([]);
  });

  it("requires a name and a recipe", () => {
    const result = productSchema.safeParse({ ...valid, name: "   ", recipeId: "" });

    expect(firstMessage(result, "name")).toBe(v.required);
    expect(firstMessage(result, "recipeId")).toBe(pv.recipeRequired);
  });

  it("rejects a name over 120 characters", () => {
    expect(firstMessage(productSchema.safeParse({ ...valid, name: "a".repeat(121) }), "name")).toBe(v.textTooLong);
  });

  it("requires a positive recipe quantity", () => {
    expect(firstMessage(productSchema.safeParse({ ...valid, recipeQuantity: "" }), "recipeQuantity")).toBe(v.required);
    expect(firstMessage(productSchema.safeParse({ ...valid, recipeQuantity: "0" }), "recipeQuantity")).toBe(v.quantityMin);
    expect(firstMessage(productSchema.safeParse({ ...valid, recipeQuantity: "abc" }), "recipeQuantity")).toBe(v.decimalInvalid);
  });

  it("reads prices in pt-BR and keeps at most two decimals", () => {
    expect(productSchema.safeParse({ ...valid, retailPrice: "1.234,50" }).data?.retailPrice).toBe(1234.5);
    expect(firstMessage(productSchema.safeParse({ ...valid, retailPrice: "10,123" }), "retailPrice")).toBe(v.decimals(2));
  });

  it("rejects a price of zero, a negative one and an unreadable one", () => {
    expect(firstMessage(productSchema.safeParse({ ...valid, retailPrice: "0" }), "retailPrice")).toBe(pv.priceMin);
    expect(firstMessage(productSchema.safeParse({ ...valid, wholesalePrice: "-5" }), "wholesalePrice")).toBe(v.decimalInvalid);
    expect(firstMessage(productSchema.safeParse({ ...valid, wholesalePrice: "abc" }), "wholesalePrice")).toBe(v.decimalInvalid);
  });

  it("rejects an absurdly high price", () => {
    expect(firstMessage(productSchema.safeParse({ ...valid, retailPrice: "999999999" }), "retailPrice")).toBe(pv.priceMax);
  });

  it("rejects a blank item quantity and the same ingredient twice", () => {
    const blank = productSchema.safeParse({ ...valid, items: [{ ingredientId: "ing-1", quantity: "" }] });
    expect(firstMessage(blank, "items.0.quantity")).toBe(v.required);

    const twice = productSchema.safeParse({
      ...valid,
      items: [
        { ingredientId: "ing-1", quantity: "1" },
        { ingredientId: "ing-1", quantity: "2" },
      ],
    });
    expect(firstMessage(twice, "items")).toBe(v.duplicateItem);
  });
});

describe("simulationSchema", () => {
  it("is valid with no prices and no items", () => {
    const result = simulationSchema.safeParse({ ...valid, retailPrice: "", wholesalePrice: "", items: [] });

    expect(result.success).toBe(true);
    expect(result.data?.retailPrice).toBeNull();
  });

  it("treats an unreadable or invalid price as not set instead of blocking the cost", () => {
    const result = simulationSchema.safeParse({ ...valid, retailPrice: "abc", wholesalePrice: "0" });

    expect(result.success).toBe(true);
    expect(result.data?.retailPrice).toBeNull();
    expect(result.data?.wholesalePrice).toBeNull();
  });

  it("still needs a recipe, a valid quantity and complete items", () => {
    expect(simulationSchema.safeParse({ ...valid, recipeId: "" }).success).toBe(false);
    expect(simulationSchema.safeParse({ ...valid, recipeQuantity: "" }).success).toBe(false);
    expect(simulationSchema.safeParse({ ...valid, items: [{ ingredientId: "ing-1", quantity: "" }] }).success).toBe(false);
  });
});