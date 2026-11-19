import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { dashboardFixture, mockDashboard } from "@/test/dashboard";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";
import { mockViewport } from "@/test/viewport";

const t = messages.dashboard;

const busyDay = () =>
  dashboardFixture({
    today: {
      date: "2026-12-02",
      orders: [
        { id: "o-42", orderNumber: 42, customerName: "Juliana Mendes", fulfillmentType: "DELIVERY", totalAmount: 180, balance: 0 },
        { id: "o-44", orderNumber: 44, customerName: "Mariana Silveira", fulfillmentType: "PICKUP", totalAmount: 210, balance: 80 },
      ],
    },
    thisWeek: { from: "2026-12-02", to: "2026-12-06", ordersCount: 8 },
    overdue: { to: "2026-12-01", ordersCount: 1 },
    month: { from: "2026-12-01", to: "2026-12-31", soldAmount: 4820, receivedAmount: 4250 },
    receivable: {
      amount: 645.5, ordersCount: 4,
      dueOnDelivery: { amount: 495.5, ordersCount: 3 },
      unpaidDelivered: { amount: 150, ordersCount: 1 },
    },
  });

describe("dashboard", () => {
  it("is the start page and shows today's orders with their balance", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockDashboard(busyDay());
    renderApp("/");

    expect(await screen.findByRole("heading", { name: t.today.title })).toBeInTheDocument();
    expect(screen.getByText("Quarta-feira, 02/12/2026")).toBeInTheDocument();
    const paid = screen.getByRole("link", { name: t.today.open(42) });
    expect(within(paid).getByText(t.today.paid)).toBeInTheDocument();
    const owing = screen.getByRole("link", { name: t.today.open(44) });
    expect(within(owing).getByText(/Falta R\$\s80,00/)).toBeInTheDocument();
    expect(owing).toHaveAttribute("href", "/orders/o-44");
  });

  it("labels sold and received distinctly, with the month name", async () => {
    mockSession(USER_EMAIL);
    mockDashboard(busyDay());
    renderApp("/");

    expect(await screen.findByText(t.sold.help("dezembro"))).toBeInTheDocument();
    expect(screen.getByText(t.received.help("dezembro"))).toBeInTheDocument();
    expect(screen.getByText(/R\$\s4\.820,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s4\.250,00/)).toBeInTheDocument();
  });

  it("splits what is receivable between orders on delivery and delivered but unpaid", async () => {
    mockSession(USER_EMAIL);
    mockDashboard(busyDay());
    renderApp("/");

    await screen.findByText(t.receivable.unpaidDelivered);
    expect(screen.getByText(/R\$\s645,50/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s495,50/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s150,00/)).toBeInTheDocument();
  });

  it("shows a neutral state for no overdue orders, without a link", async () => {
    mockSession(USER_EMAIL);
    mockDashboard(busyDay());
    mockDashboard({ ...busyDay(), overdue: { to: "2026-12-01", ordersCount: 0 } });
    renderApp("/");

    expect(await screen.findByText(t.overdue.none)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: new RegExp(t.overdue.title) })).not.toBeInTheDocument();
  });

  it("explains a negative received amount instead of showing it as an error", async () => {
    mockSession(USER_EMAIL);
    mockDashboard({ ...busyDay(), month: { from: "2026-12-01", to: "2026-12-31", soldAmount: 0, receivedAmount: -100 } });
    renderApp("/");

    expect(await screen.findByText(t.received.negative)).toBeInTheDocument();
  });

  it("shows a friendly empty state with a way to create the first order", async () => {
    mockSession(USER_EMAIL);
    mockDashboard(dashboardFixture());
    server.use(
      http.get(`${API}/api/v1/customers`, () => HttpResponse.json([])),
      http.get(`${API}/api/v1/products`, () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    renderApp("/");

    expect(await screen.findByText(t.empty.title)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: t.today.title })).not.toBeInTheDocument();

    const [createButton] = screen.getAllByRole("button", { name: t.new });
    if (!createButton) throw new Error("create button not found");
    await user.click(createButton);
    
    await waitFor(() => expect(screen.queryByText(t.empty.title)).not.toBeInTheDocument());
  });

  it("shows an error with a retry button", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/dashboard`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/");

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    mockDashboard(busyDay());
    await user.click(screen.getByRole("button", { name: t.retry }));
    expect(await screen.findByRole("heading", { name: t.today.title })).toBeInTheDocument();
  });
});

describe("dashboard shortcuts", () => {
  function captureOrderQueries() {
    const seen: URLSearchParams[] = [];
    server.use(
      http.get(`${API}/api/v1/orders`, ({ request }) => {
        seen.push(new URL(request.url).searchParams);
        return HttpResponse.json({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
      }),
      http.get(`${API}/api/v1/customers`, () => HttpResponse.json([])),
    );
    return {
      count: () => seen.length,
      first: () => {
        const [query] = seen;
        if (!query) throw new Error("no /orders request was captured");
        return query;
      },
    };
  }

  it("overdue opens confirmed orders up to the date the server provided", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockDashboard(busyDay());
    const orders = captureOrderQueries();
    const user = userEvent.setup();
    renderApp("/");

    await user.click(await screen.findByRole("link", { name: new RegExp(t.overdue.title) }));

    await waitFor(() => expect(orders.count()).toBeGreaterThan(0));
    const query = orders.first();
    expect(query.getAll("status")).toEqual(["CONFIRMED"]);
    expect(query.get("deliveryTo")).toBe("2026-12-01");
    expect(query.get("deliveryFrom")).toBeNull();
    expect(screen.getByRole("tab", { name: messages.orders.tabs.confirmed })).toHaveAttribute("aria-selected", "true");
  });

  it("week opens confirmed orders from today to Sunday, as the server provided", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockDashboard(busyDay());
    const orders = captureOrderQueries();
    const user = userEvent.setup();
    renderApp("/");

    await user.click(await screen.findByRole("link", { name: new RegExp(t.week.title) }));

    await waitFor(() => expect(orders.count()).toBeGreaterThan(0));
    const query = orders.first();
    expect(query.getAll("status")).toEqual(["CONFIRMED"]);
    expect(query.get("deliveryFrom")).toBe("2026-12-02");
    expect(query.get("deliveryTo")).toBe("2026-12-06");
  });
});