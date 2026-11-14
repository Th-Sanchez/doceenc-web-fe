import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Ingredient } from "@/api/types";
import { messages } from "@/i18n/messages";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import {
  channelFixture,
  mockProduct,
  mockProducts,
  mockProductSimulation,
  noPriceFixture,
  productFixture,
  productSimulationFixture,
} from "@/test/product";
import { mockRecipes, recipeSummaryFixture } from "@/test/recipe";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

const t = messages.productForm;
const v = messages.validation;

/** The shape the form and the picker read; swap for your ingredient fixture if you prefer. */
function catalogIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: "ing-pote",
    name: "Pote plástico",
    brandSupplier: null,
    category: { id: "cat-i1", name: "Embalagens" },
    baseUnit: "UNIT",
    unitPrice: 0.7,
    active: true,
    ...overrides,
  } as Ingredient;
}

function mockCatalog(...ingredients: Ingredient[]) {
  server.use(http.get(`${API}/api/v1/ingredients`, () => HttpResponse.json(ingredients)));
}

function mockBasics() {
  mockSession(USER_EMAIL);
  mockRecipes([recipeSummaryFixture({ id: "rec-1", name: "Bolo de pote", yieldQuantity: 10, yieldUnit: "UNIT", costPerYieldUnit: 6.8 })]);
  mockCatalog(catalogIngredient());
}

const nameInput = () => screen.getByLabelText(t.name, { exact: false });
/** The app shows a loading screen until the session answers: wait for the form before touching it. */
const findNameInput = () => screen.findByLabelText(t.name, { exact: false });
const quantityInput = () => screen.getByLabelText(t.quantity, { exact: false });
const retailPanel = () => within(screen.getByRole("region", { name: t.channel.retailTitle }));
const wholesalePanel = () => within(screen.getByRole("region", { name: t.channel.wholesaleTitle }));
const priceInput = (panel: ReturnType<typeof within>) => panel.getByLabelText(t.channel.price, { exact: false });

async function chooseRecipe(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("option", { name: "Bolo de pote" });
  await user.selectOptions(screen.getByLabelText(t.recipe, { exact: false }), "rec-1");
}

describe("new product", () => {
  it("shows the recipe's yield and cost, and the unit of the recipe next to the quantity", async () => {
    mockBasics();
    mockProductSimulation();
    const user = userEvent.setup();
    renderApp("/products/new");

    await chooseRecipe(user);

    expect(await screen.findByText(/Rende 10 un · custo R\$\s6,80 \/ un/)).toBeInTheDocument();
    expect(within(quantityInput().parentElement as HTMLElement).getByText("un")).toBeInTheDocument();
  });

  it("asks for a simulation only when the recipe and the quantity are filled, and shows the cost it answers", async () => {
    mockBasics();
    const calls = mockProductSimulation();
    const user = userEvent.setup();
    renderApp("/products/new");

    await chooseRecipe(user);
    await user.type(quantityInput(), "1");

    await waitFor(() => expect(calls.at(-1)).toEqual({ recipeId: "rec-1", recipeQuantity: 1, items: [] }));
    const summary = within(await screen.findByRole("region", { name: t.summary.title }));
    expect(await summary.findByText(/R\$\s7,50/)).toBeInTheDocument();
    expect(summary.getByText(/R\$\s0,70/)).toBeInTheDocument();
  });

  it("shows the margin, the status and the suggested price of a channel, and applies the suggestion", async () => {
    mockBasics();
    mockProductSimulation(() =>
      productSimulationFixture({
        retail: channelFixture({ status: "BELOW_TARGET", price: 11, grossProfit: 3.5, marginPercent: 31.82, suggestedPrice: 15 }),
      }),
    );
    const user = userEvent.setup();
    renderApp("/products/new");

    await chooseRecipe(user);
    await user.type(quantityInput(), "1");
    await user.type(priceInput(retailPanel()), "11");

    expect(await retailPanel().findByText("31,82%")).toBeInTheDocument();
    expect(retailPanel().getByText(t.channel.target("50%"))).toBeInTheDocument();
    expect(retailPanel().getByText(messages.products.status.BELOW_TARGET)).toBeInTheDocument();
    expect(retailPanel().getByText(/Preço sugerido: R\$\s15,00/)).toBeInTheDocument();

    await user.click(retailPanel().getByRole("button", { name: t.channel.useSuggested }));

    expect(priceInput(retailPanel())).toHaveValue("15,00");
  });

  it("warns when the price is below the cost", async () => {
    mockBasics();
    mockProductSimulation(() =>
      productSimulationFixture({
        retail: channelFixture({ status: "LOSS", price: 7, grossProfit: -0.5, marginPercent: -7.14, suggestedPrice: 15 }),
      }),
    );
    const user = userEvent.setup();
    renderApp("/products/new");

    await chooseRecipe(user);
    await user.type(quantityInput(), "1");
    await user.type(priceInput(retailPanel()), "7");

    expect(await retailPanel().findByText(t.channel.lossHint)).toBeInTheDocument();
  });

  it("explains that a channel without a price has no margin yet", async () => {
    mockBasics();
    mockProductSimulation();
    const user = userEvent.setup();
    renderApp("/products/new");

    await chooseRecipe(user);
    await user.type(quantityInput(), "1");

    expect(await wholesalePanel().findByText(t.channel.noPriceHint)).toBeInTheDocument();
  });

  it("adds an extra item from the catalog and sends it in the simulation", async () => {
    mockBasics();
    const calls = mockProductSimulation(() =>
      productSimulationFixture({
        items: [
          { ingredientId: "ing-pote", name: "Pote plástico", baseUnit: "UNIT", ingredientActive: true, quantity: 1, unitPrice: 0.7, cost: 0.7 },
        ],
      }),
    );
    const user = userEvent.setup();
    renderApp("/products/new");

    await chooseRecipe(user);
    await user.type(quantityInput(), "1");
    await user.click(screen.getByRole("button", { name: t.addExtra }));
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("button", { name: /Pote plástico/ }));

    const extraQuantity = await screen.findByLabelText(t.itemQuantity("Pote plástico"));
    await user.type(extraQuantity, "1");

    await waitFor(() =>
      expect(calls.at(-1)).toEqual({
        recipeId: "rec-1",
        recipeQuantity: 1,
        items: [{ ingredientId: "ing-pote", quantity: 1 }],
      }),
    );
    const row = extraQuantity.closest("li") as HTMLElement;
    // anchored: the row also shows the base cost "R$ 0,7000 / un"
    expect(await within(row).findByText(/^R\$\s0,70$/)).toBeInTheDocument();
  });

  it("removes an extra item", async () => {
    mockBasics();
    mockProductSimulation();
    const user = userEvent.setup();
    renderApp("/products/new");

    await user.click(await screen.findByRole("button", { name: t.addExtra }));
    await user.click(await within(await screen.findByRole("dialog")).findByRole("button", { name: /Pote plástico/ }));
    expect(await screen.findByLabelText(t.itemQuantity("Pote plástico"))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.removeItem("Pote plástico") }));

    expect(screen.queryByLabelText(t.itemQuantity("Pote plástico"))).not.toBeInTheDocument();
    expect(screen.getByText(t.extrasEmpty)).toBeInTheDocument();
  });

  it("validates the required fields before sending anything", async () => {
    mockBasics();
    mockProductSimulation();
    let posted = false;
    server.use(
      http.post(`${API}/api/v1/products`, () => {
        posted = true;
        return HttpResponse.json(productFixture(), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/products/new");

    await user.click(await screen.findByRole("button", { name: t.save }));

    expect(await screen.findByText(t.validation.recipeRequired)).toBeInTheDocument();
    expect(screen.getAllByText(v.required).length).toBeGreaterThanOrEqual(2);
    expect(posted).toBe(false);
  });

  it("creates the product with prices as numbers and goes back to the list", async () => {
    mockBasics();
    mockProductSimulation();
    mockProducts([]);
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/products`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(productFixture({ id: "prod-9" }), { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp("/products/new");

    await user.type(await findNameInput(), "Bolo de pote Ninho");
    await chooseRecipe(user);
    await user.type(quantityInput(), "1");
    await user.type(priceInput(retailPanel()), "11,00");
    await user.click(screen.getByRole("button", { name: t.save }));

    await waitFor(() =>
      expect(body).toEqual({ name: "Bolo de pote Ninho", recipeId: "rec-1", recipeQuantity: 1, retailPrice: 11, items: [] }),
    );
    expect(await screen.findByText(messages.products.empty.title)).toBeInTheDocument();
  });

  it("puts a duplicate name on the field and blocks saving until it changes", async () => {
    mockBasics();
    mockProductSimulation();
    server.use(http.post(`${API}/api/v1/products`, () => problem(409, "PRODUCT_ALREADY_EXISTS")));
    const user = userEvent.setup();
    renderApp("/products/new");

    await user.type(await findNameInput(), "Bolo de pote Ninho");
    await chooseRecipe(user);
    await user.type(quantityInput(), "1");
    await user.click(screen.getByRole("button", { name: t.save }));

    expect(await screen.findByText("Já existe um produto com este nome.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.duplicateNameSave })).toBeDisabled();

    await user.type(nameInput(), " 2");
    expect(screen.getByRole("button", { name: t.save })).toBeEnabled();
  });

  it("points to creating a recipe when there are none", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([]);
    mockCatalog();
    renderApp("/products/new");

    expect(await screen.findByText(t.noRecipes)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.createRecipe })).toHaveAttribute("href", "/recipes/new");
  });
});

describe("edit product", () => {
  const existing = () =>
    productFixture({
      id: "prod-1",
      name: "Bolo de pote Ninho",
      recipeQuantity: 1,
      retail: channelFixture({ status: "BELOW_TARGET", price: 11, grossProfit: 3.5, marginPercent: 31.82, suggestedPrice: 15 }),
      wholesale: noPriceFixture(),
      items: [
        { ingredientId: "ing-pote", name: "Pote plástico", baseUnit: "UNIT", ingredientActive: true, quantity: 1, unitPrice: 0.7, cost: 0.7 },
      ],
    });

  it("fills the form with the product", async () => {
    mockBasics();
    mockProductSimulation();
    mockProduct(existing());
    renderApp("/products/prod-1/edit");

    expect(await screen.findByDisplayValue("Bolo de pote Ninho")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(t.recipe, { exact: false })).toHaveValue("rec-1"));
    expect(quantityInput()).toHaveValue("1");
    expect(priceInput(retailPanel())).toHaveValue("11,00");
    expect(priceInput(wholesalePanel())).toHaveValue("");
    expect(screen.getByLabelText(t.itemQuantity("Pote plástico"))).toHaveValue("1");
  });

  it("saves the changes with the whole product and a cleared price left out", async () => {
    mockBasics();
    mockProductSimulation();
    mockProduct(existing());
    mockProducts([]);
    let body: unknown;
    server.use(
      http.put(`${API}/api/v1/products/prod-1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(existing());
      }),
    );
    const user = userEvent.setup();
    renderApp("/products/prod-1/edit");

    await screen.findByDisplayValue("Bolo de pote Ninho");
    await waitFor(() => expect(screen.getByLabelText(t.recipe, { exact: false })).toHaveValue("rec-1"));
    await user.clear(nameInput());
    await user.type(nameInput(), "Bolo de pote");
    await user.clear(priceInput(retailPanel()));
    await user.click(screen.getByRole("button", { name: t.saveChanges }));

    await waitFor(() =>
      expect(body).toEqual({
        name: "Bolo de pote",
        recipeId: "rec-1",
        recipeQuantity: 1,
        items: [{ ingredientId: "ing-pote", quantity: 1 }],
      }),
    );
    // saving goes back to the list: wait for it, or its request would outlive the test
    expect(await screen.findByText(messages.products.empty.title)).toBeInTheDocument();
  });

  it("keeps an archived recipe selectable for the product that already uses it", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([
      recipeSummaryFixture({ id: "rec-1", name: "Bolo de pote", active: false }),
      recipeSummaryFixture({ id: "rec-2", name: "Brigadeiro" }),
    ]);
    mockCatalog();
    mockProductSimulation();
    mockProduct(existing());
    renderApp("/products/prod-1/edit");

    expect(await screen.findByRole("option", { name: `Bolo de pote (${t.archivedTag})` })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Brigadeiro" })).toBeInTheDocument();
  });

  it("asks to restore an archived product before editing, then shows the form", async () => {
    mockBasics();
    mockProductSimulation();
    mockProduct(productFixture({ id: "prod-1", active: false }));
    server.use(
      http.post(`${API}/api/v1/products/prod-1/restore`, () => HttpResponse.json(existing())),
    );
    const user = userEvent.setup();
    renderApp("/products/prod-1/edit");

    expect(await screen.findByText(t.archivedBanner.title)).toBeInTheDocument();
    expect(screen.queryByLabelText(t.name, { exact: false })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.archivedBanner.restore }));

    expect(await screen.findByDisplayValue("Bolo de pote Ninho")).toBeInTheDocument();
  });

  it("says so when the product does not exist", async () => {
    mockBasics();
    server.use(http.get(`${API}/api/v1/products/prod-x`, () => problem(404, "PRODUCT_NOT_FOUND")));
    renderApp("/products/prod-x/edit");

    expect(await screen.findByText(t.notFound)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.backToList })).toHaveAttribute("href", "/products");
  });
});