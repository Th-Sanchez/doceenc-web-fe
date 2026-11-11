import { describe, expect, it } from "vitest";
import { createSchema, simulationSchema } from "./schemas";

const valid = {
  name: " Brigadeiro ",
  categoryId: "c1",
  yieldQuantity: "40",
  yieldUnit: "UNIT",
  prepTimeMinutes: "30",
  shelfLifeDays: "",
  items: [
    { ingredientId: "i1", quantity: "395" },
    { ingredientId: "i2", quantity: "1,5" },
  ],
};

function failedPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.path.join(".")) ?? []);
}

describe("createSchema", () => {
  it("turns the form text into the values the API needs", () => {
    expect(createSchema.parse(valid)).toEqual({
      name: "Brigadeiro",
      categoryId: "c1",
      yieldQuantity: 40,
      yieldUnit: "UNIT",
      prepTimeMinutes: 30,
      shelfLifeDays: null,
      items: [
        { ingredientId: "i1", quantity: 395 },
        { ingredientId: "i2", quantity: 1.5 },
      ],
    });
  });

  it("requires name, category and a valid yield", () => {
    const result = createSchema.safeParse({ ...valid, name: " ", categoryId: "", yieldQuantity: "0" });
    expect(failedPaths(result)).toEqual(expect.arrayContaining(["name", "categoryId", "yieldQuantity"]));
  });

  it("rejects more than 4 decimals and non numeric quantities", () => {
    expect(failedPaths(createSchema.safeParse({ ...valid, yieldQuantity: "1,23456" }))).toContain("yieldQuantity");
    expect(failedPaths(createSchema.safeParse({ ...valid, yieldQuantity: "abc" }))).toContain("yieldQuantity");
  });

  it("validates each line and points at the offending field", () => {
    const result = createSchema.safeParse({
      ...valid,
      items: [{ ingredientId: "i1", quantity: "395" }, { ingredientId: "", quantity: "0" }],
    });
    expect(failedPaths(result)).toEqual(expect.arrayContaining(["items.1.ingredientId", "items.1.quantity"]));
  });

  it("needs at least one line and no repeated ingredient", () => {
    expect(failedPaths(createSchema.safeParse({ ...valid, items: [] }))).toContain("items");
    const repeated = createSchema.safeParse({
      ...valid,
      items: [{ ingredientId: "i1", quantity: "1" }, { ingredientId: "i1", quantity: "2" }],
    });
    expect(failedPaths(repeated)).toContain("items");
  });

  it("accepts only positive whole numbers for preparation time and shelf life", () => {
    for (const bad of ["abc", "0", "1,5", "-3", "100000"]) {
      expect(failedPaths(createSchema.safeParse({ ...valid, prepTimeMinutes: bad }))).toContain("prepTimeMinutes");
    }
    expect(createSchema.parse({ ...valid, shelfLifeDays: "5" }).shelfLifeDays).toBe(5);
  });

  it("only accepts the known yield units", () => {
    expect(failedPaths(createSchema.safeParse({ ...valid, yieldUnit: "KILOGRAM" }))).toContain("yieldUnit");
  });
});

describe("simulationSchema", () => {
  it("accepts a form with no lines yet", () => {
    expect(simulationSchema.parse({ yieldQuantity: "10", items: [] })).toEqual({ yieldQuantity: 10, items: [] });
  });

  it("rejects half filled lines and repeated ingredients", () => {
    expect(simulationSchema.safeParse({ yieldQuantity: "10", items: [{ ingredientId: "i1", quantity: "" }] }).success).toBe(false);
    expect(
      simulationSchema.safeParse({
        yieldQuantity: "10",
        items: [{ ingredientId: "i1", quantity: "1" }, { ingredientId: "i1", quantity: "2" }],
      }).success,
    ).toBe(false);
    expect(simulationSchema.safeParse({ yieldQuantity: "", items: [] }).success).toBe(false);
  });
});