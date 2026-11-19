import { http, HttpResponse } from "msw";
import type { Dashboard } from "@/api/types";
import { API } from "./api";
import { server } from "./server";

export function dashboardFixture(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    today: { date: "2026-12-02", orders: [] },
    thisWeek: { from: "2026-12-02", to: "2026-12-06", ordersCount: 0 },
    overdue: { to: "2026-12-01", ordersCount: 0 },
    month: { from: "2026-12-01", to: "2026-12-31", soldAmount: 0, receivedAmount: 0 },
    receivable: {
      amount: 0, ordersCount: 0,
      dueOnDelivery: { amount: 0, ordersCount: 0 },
      unpaidDelivered: { amount: 0, ordersCount: 0 },
    },
    ...overrides,
  };
}

export function mockDashboard(data: Dashboard = dashboardFixture()) {
  server.use(http.get(`${API}/api/v1/dashboard`, () => HttpResponse.json(data)));
}