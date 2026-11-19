import type { Dashboard } from "@/api/types";

export function isDashboardEmpty(data: Dashboard): boolean {
  return (
    data.today.orders.length === 0 &&
    data.thisWeek.ordersCount === 0 &&
    data.overdue.ordersCount === 0 &&
    data.month.soldAmount === 0 &&
    data.month.receivedAmount === 0 &&
    data.receivable.ordersCount === 0
  );
}