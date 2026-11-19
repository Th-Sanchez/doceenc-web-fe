import { z } from "zod";
import { messages } from "@/i18n/messages";

const v = messages.validation;

export const customerSchema = z
  .object({
    name: z.string().trim().min(1, v.required).max(120, v.maxLength(120)),
    type: z.enum(["RETAIL", "WHOLESALE"]),
    storeName: z.string().trim().max(120, v.maxLength(120)),
    phone: z.string().trim().refine((value) => {
      const digits = value.replace(/\D/g, "");
      return value === "" || (/^[\d\s()+-]+$/.test(value) && /^\d{10,11}$/.test(digits));
    }, messages.customerForm.phoneInvalid),
    address: z.string().trim().max(255, v.maxLength(255)),
    notes: z.string().trim().max(1000, v.maxLength(1000)),
  })
  .superRefine((values, context) => {
    if (values.type === "WHOLESALE" && values.storeName.length === 0) {
      context.addIssue({ code: "custom", path: ["storeName"], message: v.required });
    }
  });

export type CustomerFormInput = z.input<typeof customerSchema>;
export type CustomerFormValues = z.output<typeof customerSchema>;
