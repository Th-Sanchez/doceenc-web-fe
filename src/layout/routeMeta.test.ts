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

  it("knows nothing about unknown paths", () => {
    expect(routeMetaFor("/nope")).toBeNull();
  });
});