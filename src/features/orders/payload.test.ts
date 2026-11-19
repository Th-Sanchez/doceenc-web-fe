import { describe, expect, it } from "vitest";
import { toOrderInput, validateOrderDraft } from "./payload";
import type { OrderDraft } from "./schemas";

const validDraft: OrderDraft = {
  customerId: "customer-1",
  fulfillmentType: "PICKUP",
  deliveryAddress: "Ignored for pickup",
  deliveryDate: "2025-03-10",
  notes: "  Leave at the front desk  ",
  items: [{ productId: "product-1", quantity: 2 }],
};

describe("order payload", () => {
  it("omits a delivery address for pickup and trims optional notes", () => {
    expect(toOrderInput(validDraft)).toEqual({
      customerId: "customer-1",
      fulfillmentType: "PICKUP",
      deliveryDate: "2025-03-10",
      notes: "Leave at the front desk",
      items: [{ productId: "product-1", quantity: 2 }],
    });
  });

  it("requires a delivery address and at least one valid item", () => {
    const result = validateOrderDraft({
      ...validDraft,
      fulfillmentType: "DELIVERY",
      deliveryAddress: " ",
      items: [{ productId: "product-1", quantity: 0 }],
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["items", "deliveryAddress"]);
  });

  it("does not accept an empty order", () => {
    const result = validateOrderDraft({ ...validDraft, items: [] });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === "items")).toBe(true);
  });
});
