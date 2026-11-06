import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { categoryFixture, ingredientFixture, mockCategories, mockIngredients } from "@/test/ingredients";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";
import { mockViewport } from "@/test/viewport";

const t = messages.ingredients;
const c = messages.categoriesDialog;

describe("ingredients list", () => {
  it("lists ingredients and filters by search ignoring accents", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([
      ingredientFixture({ id: "a", name: "Açúcar refinado" }),
      ingredientFixture({ id: "b", name: "Farinha de trigo" }),
    ]);
    const user = userEvent.setup();
    renderApp("/ingredients");

    expect(await screen.findByText("Açúcar refinado")).toBeInTheDocument();
    await user.type(screen.getByLabelText(t.searchLabel), "acucar");

    expect(screen.queryByText("Farinha de trigo")).not.toBeInTheDocument();
    expect(screen.getByText("Açúcar refinado")).toBeInTheDocument();
  });

  it("hides archived ingredients until the toggle is on", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([
      ingredientFixture({ id: "a", name: "Farinha de trigo" }),
      ingredientFixture({ id: "b", name: "Cacau em pó", active: false }),
    ]);
    const user = userEvent.setup();
    renderApp("/ingredients");

    await screen.findByText("Farinha de trigo");
    expect(screen.queryByText("Cacau em pó")).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: t.showArchived }));
    expect(await screen.findByText("Cacau em pó")).toBeInTheDocument();
  });

  it("shows an error with a retry button when the list fails to load", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/ingredients`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/ingredients");

    expect(await screen.findByRole("alert")).toHaveTextContent(t.loadError);

    mockIngredients([ingredientFixture({ name: "Farinha de trigo" })]);
    await user.click(screen.getByRole("button", { name: t.retry }));
    expect(await screen.findByText("Farinha de trigo")).toBeInTheDocument();
  });

  it("archives an ingredient from its menu after confirming", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([ingredientFixture({ id: "ing-1", name: "Farinha de trigo" })]);
    let archived = false;
    server.use(
      http.post(`${API}/api/v1/ingredients/ing-1/archive`, () => {
        archived = true;
        return HttpResponse.json(ingredientFixture({ active: false }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/ingredients");

    await user.click(await screen.findByRole("button", { name: t.actions.menu("Farinha de trigo") }));
    await user.click(await screen.findByRole("menuitem", { name: t.actions.archive }));
    await user.click(await screen.findByRole("button", { name: t.archiveDialog.confirm }));

    await waitFor(() => expect(archived).toBe(true));
  });
});

describe("categories dialog", () => {
  it("creates a category and clears the field", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([ingredientFixture()]);
    mockCategories([categoryFixture()]);
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/categories`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(categoryFixture({ id: "cat-2", name: "Laticínios" }), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/ingredients");

    await user.click(await screen.findByRole("button", { name: t.categories }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(c.newLabel), "Laticínios");
    await user.click(within(dialog).getByRole("button", { name: c.add }));

    await waitFor(() => expect(body).toEqual({ name: "Laticínios", type: "INGREDIENT" }));
    await waitFor(() => expect(within(dialog).getByLabelText(c.newLabel)).toHaveValue(""));
  });

  it("explains why a category in use cannot be deleted", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([ingredientFixture()]);
    mockCategories([categoryFixture({ id: "cat-1", name: "Farinhas" })]);
    server.use(http.delete(`${API}/api/v1/categories/cat-1`, () => problem(409, "CATEGORY_IN_USE")));
    const user = userEvent.setup();
    renderApp("/ingredients");

    await user.click(await screen.findByRole("button", { name: t.categories }));
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("button", { name: c.delete("Farinhas") }));
    await user.click(within(dialog).getByRole("button", { name: c.confirm }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Esta categoria está em uso e não pode ser excluída.",
    );
  });
});

describe("desktop layout", () => {
  it("renders the sidebar and the catalog as a table with the unit cost column", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockIngredients([ingredientFixture({ name: "Farinha de trigo", unitPrice: 0.0052 })]);
    renderApp("/ingredients");

    expect(await screen.findByRole("columnheader", { name: t.columns.unitCost })).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Farinha de trigo/ });
    expect(within(row).getByText(/R\$\s0,0052 \/ g/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: messages.nav.main })).toBeInTheDocument();
    expect(screen.getByText(USER_EMAIL)).toBeInTheDocument();
  });
});