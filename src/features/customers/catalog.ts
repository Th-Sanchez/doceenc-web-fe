import type { Customer, CustomerType } from "@/api/types";
import { normalizeText } from "@/lib/catalog";

export type CustomerFilter = "all" | CustomerType | "archived";

export function filterCustomers(
  customers: Customer[],
  filter: CustomerFilter,
  search: string,
  includeArchived = false,
): Customer[] {
  const term = normalizeText(search.trim());
  return customers.filter((customer) => {
    if (filter === "archived" && customer.active) return false;
    if (filter !== "archived" && !includeArchived && !customer.active) return false;
    if (filter !== "all" && filter !== "archived" && customer.type !== filter) return false;
    return (
      term === "" ||
      normalizeText(customer.name).includes(term) ||
      normalizeText(customer.phone ?? "").includes(term) ||
      normalizeText(customer.storeName ?? "").includes(term)
    );
  });
}

export function formatCustomerPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return phone;
}
