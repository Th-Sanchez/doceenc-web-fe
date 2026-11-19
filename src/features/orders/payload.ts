import { z } from "zod";
import { messages } from "@/i18n/messages";
import type { OrderDraft } from "./schemas";
import type { OrderInput } from "@/api/types";

const t = messages.orders.form;

export function toOrderInput(values: OrderDraft): OrderInput {
  const deliveryAddress = values.fulfillmentType === "DELIVERY" ? values.deliveryAddress.trim() : "";
  const notes = values.notes.trim();

  return {
    customerId: values.customerId,
    fulfillmentType: values.fulfillmentType,
    items: values.items.map(({ productId, quantity }) => ({ productId, quantity })),
    ...(deliveryAddress ? { deliveryAddress } : {}),
    ...(values.deliveryDate ? { deliveryDate: values.deliveryDate } : {}),
    ...(notes ? { notes } : {}),
  };
}

export function validateOrderDraft(values: OrderDraft) {
  return orderDraftSchema.safeParse(values);
}

const orderDraftSchema = z
  .object({
    customerId: z.string().min(1, t.required),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    deliveryAddress: z.string(),
    deliveryDate: z.string(),
    notes: z.string(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive(t.quantityInvalid),
        }),
      )
      .min(1, t.noItems),
  })
  .superRefine((values, ctx) => {
    if (values.fulfillmentType === "DELIVERY" && !values.deliveryAddress.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddress"],
        message: t.required,
      });
    }
  });
