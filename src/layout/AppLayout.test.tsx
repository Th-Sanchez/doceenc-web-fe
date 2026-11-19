import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { API, mockSession, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";
import { mockViewport } from "@/test/viewport";
import { messages } from "@/i18n/messages";

describe("mobile navigation", () => {
  it("allows opening orders when there are no customers", async () => {
    mockViewport(false);
    mockSession(USER_EMAIL);
    server.use(
      http.get(`${API}/api/v1/customers`, () => HttpResponse.json([])),
      http.get(`${API}/api/v1/orders`, () =>
        HttpResponse.json({ items: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
      ),
    );
    const user = userEvent.setup();
    renderApp("/");

    const navigation = await screen.findByRole("navigation", { name: messages.nav.main });
    const expectedTabs = [
      messages.nav.home,
      messages.nav.ingredients,
      messages.nav.recipes,
      messages.nav.productsShort,
      messages.nav.customers,
      messages.nav.ordersShort,
    ];
    for (const label of expectedTabs) {
      expect(within(navigation).getByRole("link", { name: label })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("link", { name: messages.nav.ordersShort }));

    expect(await screen.findByRole("heading", { name: messages.orders.title })).toBeInTheDocument();
    for (const label of expectedTabs) {
      expect(within(navigation).getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(await screen.findByText(messages.orders.empty)).toBeInTheDocument();
  });
});
