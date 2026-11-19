import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { routeMetaFor } from "./routeMeta";

describe("routeMetaFor", () => {
  it("describes list pages without a form header", () => {
    expect(routeMetaFor("/")?.form).toBeUndefined();
    expect(routeMetaFor("/ingredients")?.section).toBe(messages.nav.ingredientManagement);
    expect(routeMetaFor("/ingredients")?.form).toBeUndefined();
  });

  it("describes form pages with title and way back", () => {
    expect(routeMetaFor("/ingredients/new")?.form).toEqual({
      title: messages.ingredientForm.newTitle,
      backTo: "/ingredients",
    });
    expect(routeMetaFor("/ingredients/abc-123/edit")?.form?.title).toBe(messages.ingredientForm.editTitle);
    expect(routeMetaFor("/ingredients/abc-123/price")?.form?.title).toBe(messages.priceForm.title);
  });

  it("describes the recipe pages", () => {
    expect(routeMetaFor("/recipes")?.section).toBe(messages.nav.recipeBook);
    expect(routeMetaFor("/recipes")?.form).toBeUndefined();
    expect(routeMetaFor("/recipes/new")?.form).toEqual({ title: messages.recipeForm.newTitle, backTo: "/recipes" });
    expect(routeMetaFor("/recipes/abc-123/edit")?.form?.title).toBe(messages.recipeForm.editTitle);
    expect(routeMetaFor("/recipes/abc-123")?.form?.title).toBe(messages.recipeSheet.title);
  });

  it("describes the customer pages", () => {
    expect(routeMetaFor("/customers")?.section).toBe(messages.nav.customers);
    expect(routeMetaFor("/customers")?.form).toBeUndefined();
    expect(routeMetaFor("/customers/new")?.form).toEqual({
      title: messages.customerForm.newTitle,
      backTo: "/customers",
    });
    expect(routeMetaFor("/customers/customer-1/edit")?.form?.title).toBe(messages.customerForm.editTitle);
  });

  it("knows nothing about unknown paths", () => {
    expect(routeMetaFor("/nope")).toBeNull();
  });
});