import { describe, expect, it } from "vitest";
import type { Customer } from "@/api/types";
import { filterCustomers, formatCustomerPhone } from "./catalog";

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    name: "Juliana Mendes",
    type: "WHOLESALE",
    phone: "11984123344",
    address: "Rua Oscar Freire",
    storeName: "Café & Afeto Bistrô",
    notes: null,
    active: true,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  };
}

describe("customer catalog", () => {
  it("filters by type, archived status and normalized contact details", () => {
    const customers = [
      customer(),
      customer({ id: "customer-2", name: "Maria Silva", type: "RETAIL", storeName: null, phone: null }),
      customer({ id: "customer-3", name: "Carlos Santos", active: false }),
    ];

    expect(filterCustomers(customers, "all", "")).toEqual(customers.slice(0, 2));
    expect(filterCustomers(customers, "RETAIL", "maria")).toEqual([customers[1]]);
    expect(filterCustomers(customers, "all", "cafe", true)).toEqual([customers[0], customers[2]]);
    expect(filterCustomers(customers, "archived", "")).toEqual([customers[2]]);
  });

  it("formats Brazilian mobile and landline numbers", () => {
    expect(formatCustomerPhone("11984123344")).toBe("(11) 98412-3344");
    expect(formatCustomerPhone("1132345678")).toBe("(11) 3234-5678");
    expect(formatCustomerPhone(null)).toBeNull();
  });
});
