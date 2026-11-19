import type { OrderFulfillmentType } from "@/api/types";

export interface OrderDraft {
  customerId: string;
  fulfillmentType: OrderFulfillmentType;
  deliveryAddress: string;
  deliveryDate: string;
  notes: string;
  items: { productId: string; quantity: number }[];
}

export const emptyOrderDraft: OrderDraft = {
  customerId: "",
  fulfillmentType: "PICKUP",
  deliveryAddress: "",
  deliveryDate: "",
  notes: "",
  items: [],
};
