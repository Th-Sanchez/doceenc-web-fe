import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Customer } from "@/api/types";
import { messages } from "@/i18n/messages";
import { API, mockSession, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

const t = messages.customerForm;

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    name: "Helena Vasconcellos",
    type: "RETAIL",
    phone: "11999999999",
    address: null,
    storeName: null,
    notes: null,
    active: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("customer form", () => {
  it("validates the name and required store before sending a request", async () => {
    mockSession(USER_EMAIL);
    let posted = false;
    server.use(http.post(`${API}/api/v1/customers`, () => {
      posted = true;
      return HttpResponse.json(customer(), { status: 201 });
    }));
    const user = userEvent.setup();
    renderApp("/customers/new");

    await user.click(await screen.findByRole("button", { name: t.save }));

    expect(await screen.findAllByText(messages.validation.required)).toHaveLength(2);
    expect(posted).toBe(false);
  });

  it("saves optional contact fields only when provided and sends the phone as digits", async () => {
    mockSession(USER_EMAIL);
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/customers`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(customer({ name: "Maria Silva", type: "RETAIL", phone: "11971234567" }), { status: 201 });
      }),
      http.get(`${API}/api/v1/customers`, () => HttpResponse.json([])),
    );
    const user = userEvent.setup();
    renderApp("/customers/new");

    await user.type(await screen.findByPlaceholderText(t.namePlaceholder), "Maria Silva");
    await user.click(screen.getByRole("radio", { name: t.retail }));
    await user.type(screen.getByPlaceholderText(t.phonePlaceholder), "(11) 97123-4567");
    await user.click(screen.getByRole("button", { name: t.save }));

    await waitFor(() => expect(body).toEqual({ name: "Maria Silva", type: "RETAIL", phone: "11971234567" }));
    expect(await screen.findByText(messages.customers.empty.title)).toBeInTheDocument();
  });
});
