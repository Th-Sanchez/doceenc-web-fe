import type { OrderStatus } from "@/api/types";

const statuses: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"];

export interface OrderListShortcut {
  status?: OrderStatus;
  deliveryFrom?: string;
  deliveryTo?: string;
}

/** Link to the orders list already filtered; the dates come from the API, never computed here. */
export function orderListHref(shortcut: OrderListShortcut): string {
  const params = new URLSearchParams();
  if (shortcut.status) params.set("status", shortcut.status);
  if (shortcut.deliveryFrom) params.set("deliveryFrom", shortcut.deliveryFrom);
  if (shortcut.deliveryTo) params.set("deliveryTo", shortcut.deliveryTo);
  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

export function parseOrderListShortcut(params: URLSearchParams): OrderListShortcut {
  const status = params.get("status");
  return {
    status: statuses.find((candidate) => candidate === status),
    deliveryFrom: params.get("deliveryFrom") ?? undefined,
    deliveryTo: params.get("deliveryTo") ?? undefined,
  };
}