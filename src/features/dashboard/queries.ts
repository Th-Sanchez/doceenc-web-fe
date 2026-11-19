import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";
import { unwrap } from "@/api/unwrap";
import { orderKeys } from "@/features/orders/queries";

/**
 * Nested under orderKeys.all on purpose: every order mutation (confirm, deliver, cancel, payments)
 * already invalidates that prefix, so the dashboard refreshes without `orders` importing `dashboard`.
 */
export const dashboardKeys = { all: [...orderKeys.all, "dashboard"] as const };

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => unwrap(api.GET("/api/v1/dashboard")),
  });
}