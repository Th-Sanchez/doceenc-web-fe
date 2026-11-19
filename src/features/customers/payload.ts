import type { CreateCustomerInput } from "@/api/types";
import type { CustomerFormValues } from "./schemas";

export function toCustomerBody(values: CustomerFormValues): CreateCustomerInput {
  const phone = values.phone.replace(/\D/g, "");
  return {
    name: values.name,
    type: values.type,
    ...(values.type === "WHOLESALE" ? { storeName: values.storeName } : {}),
    ...(phone ? { phone } : {}),
    ...(values.address ? { address: values.address } : {}),
    ...(values.notes ? { notes: values.notes } : {}),
  };
}
