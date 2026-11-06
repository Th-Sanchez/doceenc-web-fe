import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { categoryFixture, ingredientFixture, mockCategories, mockIngredients } from "@/test/ingredients";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

const f = messages.ingredientForm;
const p = messages.priceForm;
type User = ReturnType<typeof userEvent.setup>;

function captureBody(method: "post" | "put", url: string, respondWith: () => Response) {
  const captured: { body?: unknown } = {};
  server.use(
    http[method](`${API}${url}`, async ({ request }) => {
      captured.body = await request.json();
      return respondWith();
    }),
  );
  return captured;
}

const created = () => HttpResponse.json(ingredientFixture(), { status: 201 });

async function fillNewIngredient(user: User) {
  await user.type(await screen.findByLabelText(f.name), "Farinha de trigo");
  await screen.findByRole("option", { name: "Farinhas" });
  await user.selectOptions(screen.getByLabelText(f.category), "Farinhas");
  await user.type(screen.getByLabelText(f.packagePrice), "5,20");
  await user.type(screen.getByLabelText(f.packageQuantity), "1.000");
}

function setupNew() {
  mockSession(USER_EMAIL);
  mockCategories([categoryFixture()]);
  mockIngredients([]);
}

describe("new ingredient", () => {
  it("sends the normalized payload and goes back to the list", async () => {
    setupNew();
    const captured = captureBody("post", "/api/v1/ingredients", created);
    const user = userEvent.setup();
    renderApp("/ingredients/new");

    await fillNewIngredient(user);
    await user.click(screen.getByRole("button", { name: f.save }));

    await waitFor(() =>
      expect(captured.body).toMatchObject({
        name: "Farinha de trigo",
        categoryId: "cat-1",
        baseUnit: "GRAM",
        price: { packagePrice: 5.2, packageQuantity: 1000, unit: "G" },
      }),
    );
    expect(await screen.findByRole("heading", { name: messages.ingredients.title })).toBeInTheDocument();
  });

  it("confirms how the quantity was read and fills the quick presets literally", async () => {
    setupNew();
    const user = userEvent.setup();
    renderApp("/ingredients/new");

    await user.type(await screen.findByLabelText(f.packageQuantity), "1.500");
    expect(screen.getByText(f.quantityRead("1.500 g"))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "395 g" }));
    expect(screen.getByLabelText(f.packageQuantity)).toHaveValue("395");
  });

  it("shows required-field messages and sends nothing when the form is empty", async () => {
    setupNew();
    const user = userEvent.setup();
    renderApp("/ingredients/new");

    await user.click(await screen.findByRole("button", { name: f.save }));

    expect(await screen.findAllByText(messages.validation.required)).toHaveLength(3);
    expect(screen.getByText(messages.validation.categoryRequired)).toBeInTheDocument();
  });

  it("puts server validation errors under the right input", async () => {
    setupNew();
    server.use(
      http.post(`${API}/api/v1/ingredients`, () =>
        HttpResponse.json(
          {
            type: "about:blank",
            title: "error",
            status: 400,
            detail: "x",
            code: "VALIDATION_FAILED",
            errors: [{ field: "price.packagePrice", code: "DecimalMin" }],
          },
          { status: 400, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp("/ingredients/new");

    await fillNewIngredient(user);
    await user.click(screen.getByRole("button", { name: f.save }));

    expect(await screen.findByText("O valor mínimo é 0,01.")).toBeInTheDocument();
  });

  it("offers to restore an archived ingredient with the same identity", async () => {
    mockSession(USER_EMAIL);
    mockCategories([categoryFixture()]);
    mockIngredients([ingredientFixture({ id: "arch-1", name: "Farinha de trigo", active: false })]);
    server.use(http.post(`${API}/api/v1/ingredients`, () => problem(409, "ARCHIVED_INGREDIENT_EXISTS")));
    let restored = false;
    server.use(
      http.post(`${API}/api/v1/ingredients/arch-1/restore`, () => {
        restored = true;
        return HttpResponse.json(ingredientFixture({ id: "arch-1" }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/ingredients/new");

    await fillNewIngredient(user);
    await user.click(screen.getByRole("button", { name: f.save }));
    await user.click(await screen.findByRole("button", { name: f.restoreExisting }));

    await waitFor(() => expect(restored).toBe(true));
  });
});

describe("edit ingredient", () => {
  it("loads the current values and sends only the descriptive fields", async () => {
    mockSession(USER_EMAIL);
    mockCategories([categoryFixture()]);
    mockIngredients([ingredientFixture({ id: "ing-1", name: "Farinha de trigo", brandSupplier: "Dona Benta" })]);
    const captured = captureBody("put", "/api/v1/ingredients/ing-1", () => HttpResponse.json(ingredientFixture()));
    const user = userEvent.setup();
    renderApp("/ingredients/ing-1/edit");

    const name = await screen.findByLabelText(f.name);
    expect(name).toHaveValue("Farinha de trigo");
    expect(screen.getByLabelText(f.brandSupplier)).toHaveValue("Dona Benta");
    await user.clear(name);
    await user.type(name, "Farinha especial");
    await user.click(screen.getByRole("button", { name: f.saveChanges }));

    await waitFor(() =>
      expect(captured.body).toEqual({ name: "Farinha especial", brandSupplier: "Dona Benta", categoryId: "cat-1" }),
    );
  });

  it("says so when the ingredient does not exist", async () => {
    mockSession(USER_EMAIL);
    mockCategories([categoryFixture()]);
    mockIngredients([]);
    renderApp("/ingredients/missing/edit");

    expect(await screen.findByText(f.notFound)).toBeInTheDocument();
  });
});

describe("adjust price", () => {
  const history = [
    { id: "p2", packagePrice: 6, packageQuantity: 1000, unitPrice: 0.006, purchasedOn: "2026-10-20", createdAt: "2026-10-20T10:00:00Z" },
    { id: "p1", packagePrice: 5.2, packageQuantity: 1000, unitPrice: 0.0052, purchasedOn: "2026-10-01", createdAt: "2026-10-01T10:00:00Z" },
  ];

  it("starts from the current price, shows the history and registers the purchase", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([ingredientFixture({ id: "ing-1", packagePrice: 5.2, packageQuantity: 1000 })]);
    server.use(http.get(`${API}/api/v1/ingredients/ing-1/prices`, () => HttpResponse.json(history)));
    const captured = captureBody("post", "/api/v1/ingredients/ing-1/prices", created);
    const user = userEvent.setup();
    renderApp("/ingredients/ing-1/price");

    const price = await screen.findByLabelText(f.packagePrice);
    expect(price).toHaveValue("5,20");
    expect(await screen.findByText(p.records(2))).toBeInTheDocument();
    expect(screen.getByText(p.current)).toBeInTheDocument();

    await user.clear(price);
    await user.type(price, "6,00");
    await user.click(screen.getByRole("button", { name: p.submit }));

    await waitFor(() =>
      expect(captured.body).toMatchObject({ packagePrice: 6, packageQuantity: 1000, unit: "G" }),
    );
  });

  it("puts a future-date rejection on the date field", async () => {
    mockSession(USER_EMAIL);
    mockIngredients([ingredientFixture({ id: "ing-1" })]);
    server.use(
      http.get(`${API}/api/v1/ingredients/ing-1/prices`, () => HttpResponse.json(history)),
      http.post(`${API}/api/v1/ingredients/ing-1/prices`, () => problem(422, "PURCHASE_DATE_IN_FUTURE")),
    );
    const user = userEvent.setup();
    renderApp("/ingredients/ing-1/price");

    await user.click(await screen.findByRole("button", { name: p.submit }));

    expect(await screen.findByText(messages.validation.dateFuture)).toBeInTheDocument();
  });
});