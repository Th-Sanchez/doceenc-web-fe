import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import {
  channelFixture,
  mockProducts,
  noPriceFixture,
  productFixture,
  productSummaryFixture,
} from "@/test/product";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

const t = messages.products;
// the Ativas | Arquivadas switch is the recipes' one, so its labels live with the recipes
const status = messages.recipes.status;

const cardTitles = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

const onTarget = { retail: channelFixture(), wholesale: noPriceFixture() };
const loss = {
  retail: channelFixture({ status: "LOSS", price: 7, grossProfit: -0.5, marginPercent: -7.14 }),
  wholesale: noPriceFixture(),
};
const below = {
  retail: channelFixture({ status: "BELOW_TARGET", price: 11, grossProfit: 3.5, marginPercent: 31.82 }),
  wholesale: noPriceFixture(),
};

describe("products list", () => {
  it("lists active products first, with the counts of each status", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({ id: "a", name: "Brigadeiro" }),
      productSummaryFixture({ id: "b", name: "Beijinho" }),
      productSummaryFixture({ id: "c", name: "Cajuzinho", active: false }),
    ]);
    renderApp("/products");

    expect(await screen.findByRole("heading", { name: "Brigadeiro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beijinho" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cajuzinho" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: status.active(2) })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: status.archived(1) })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the unit cost with its breakdown and both channels with margin, status and suggestion", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({
        id: "prod-1",
        name: "Bolo de pote Ninho",
        cost: { recipeCost: 6.8, extrasCost: 0.7, totalCost: 7.5 },
        retail: channelFixture({ status: "BELOW_TARGET", price: 11, grossProfit: 3.5, marginPercent: 31.82, suggestedPrice: 15 }),
        wholesale: noPriceFixture(),
      }),
    ]);
    renderApp("/products");

    const card = (await screen.findByRole("heading", { name: "Bolo de pote Ninho" })).closest("li") as HTMLElement;
    expect(within(card).getByText(t.recipeLine("Bolo de pote"))).toBeInTheDocument();
    expect(within(card).getByText(/R\$\s7,50/)).toBeInTheDocument();
    expect(within(card).getByText(/Receita R\$\s6,80 \+ extras R\$\s0,70/)).toBeInTheDocument();
    expect(within(card).getByText(/R\$\s11,00/)).toBeInTheDocument();
    expect(within(card).getByText(t.margin("31,82%", "50%"))).toBeInTheDocument();
    expect(within(card).getByText(t.status.BELOW_TARGET)).toBeInTheDocument();
    expect(within(card).getByText(/Sugerido: R\$\s15,00/)).toBeInTheDocument();
    expect(within(card).getByText(t.status.NO_PRICE)).toBeInTheDocument();
    expect(within(card).getByText(/Sugerido: R\$\s11,54/)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: t.editLabel("Bolo de pote Ninho") })).toHaveAttribute(
      "href",
      "/products/prod-1/edit",
    );
  });

  it("does not repeat the breakdown when there are no extra items, nor suggest a price already reached", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({
        name: "Brigadeiro",
        cost: { recipeCost: 7.5, extrasCost: 0, totalCost: 7.5 },
        retail: channelFixture({ status: "ON_TARGET", suggestedPrice: 15 }),
        wholesale: channelFixture({ status: "ON_TARGET", targetMarginPercent: 35, suggestedPrice: 11.54 }),
      }),
    ]);
    renderApp("/products");

    const card = (await screen.findByRole("heading", { name: "Brigadeiro" })).closest("li") as HTMLElement;
    expect(within(card).queryByText(/extras/)).not.toBeInTheDocument();
    expect(within(card).queryByText(/Sugerido:/)).not.toBeInTheDocument();
  });

  it("filters by the situation of the product, with chips that add up", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({ id: "a", name: "Brigadeiro", ...onTarget }),
      productSummaryFixture({ id: "b", name: "Bolo", ...loss }),
      productSummaryFixture({ id: "c", name: "Brownie", ...below }),
    ]);
    const user = userEvent.setup();
    renderApp("/products");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    expect(screen.getByRole("button", { name: `${t.allStatuses} (3)` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${t.status.LOSS} (1)` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${t.status.BELOW_TARGET} (1)` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `${t.status.ON_TARGET} (1)` })).toBeInTheDocument();
    // nobody is unpriced, so there is no chip for it
    expect(screen.queryByRole("button", { name: new RegExp(t.status.NO_PRICE) })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: `${t.status.LOSS} (1)` }));
    expect(cardTitles()).toEqual(["Bolo"]);

    await user.click(screen.getByRole("button", { name: `${t.allStatuses} (3)` }));
    expect(cardTitles()).toHaveLength(3);
  });

  it("counts a product with only one priced channel by that channel", async () => {
    mockSession(USER_EMAIL);
    mockProducts([productSummaryFixture({ name: "Brigadeiro", ...onTarget })]);
    renderApp("/products");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    expect(screen.getByRole("button", { name: `${t.status.ON_TARGET} (1)` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(t.status.NO_PRICE) })).not.toBeInTheDocument();
  });

  it("searches by product name and by recipe name", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({ id: "a", name: "Brigadeiro" }),
      productSummaryFixture({
        id: "b",
        name: "Brownie",
        recipe: { ...productSummaryFixture().recipe, id: "rec-2", name: "Fatia selada" },
      }),
    ]);
    const user = userEvent.setup();
    renderApp("/products");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    await user.type(screen.getByLabelText(t.searchLabel), "BRIGA");
    expect(cardTitles()).toEqual(["Brigadeiro"]);

    await user.clear(screen.getByLabelText(t.searchLabel));
    await user.type(screen.getByLabelText(t.searchLabel), "selada");
    expect(cardTitles()).toEqual(["Brownie"]);
  });

  it("puts the most urgent first and sorts by the chosen criterion", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({ id: "a", name: "Brigadeiro", ...onTarget, cost: { recipeCost: 1, extrasCost: 0, totalCost: 1 } }),
      productSummaryFixture({ id: "b", name: "Bolo", ...loss, cost: { recipeCost: 8, extrasCost: 0, totalCost: 8 } }),
      productSummaryFixture({ id: "c", name: "Brownie", ...below, cost: { recipeCost: 3, extrasCost: 0, totalCost: 3 } }),
    ]);
    const user = userEvent.setup();
    renderApp("/products");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    expect(cardTitles()).toEqual(["Bolo", "Brownie", "Brigadeiro"]);

    await user.selectOptions(screen.getByLabelText(t.sortLabel), "name");
    expect(cardTitles()).toEqual(["Bolo", "Brigadeiro", "Brownie"]);

    await user.selectOptions(screen.getByLabelText(t.sortLabel), "cost");
    expect(cardTitles()).toEqual(["Bolo", "Brownie", "Brigadeiro"]);
  });

  it("warns about an archived recipe and about archived ingredients", async () => {
    mockSession(USER_EMAIL);
    mockProducts([
      productSummaryFixture({ id: "a", name: "Brigadeiro", archivedIngredientCount: 2 }),
      productSummaryFixture({
        id: "b",
        name: "Beijinho",
        recipe: { ...productSummaryFixture().recipe, active: false },
      }),
      productSummaryFixture({ id: "c", name: "Brownie" }),
    ]);
    renderApp("/products");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    expect(screen.getAllByText(t.archivedIngredients(2))).toHaveLength(1);
    expect(screen.getAllByText(t.archivedRecipe)).toHaveLength(1);
    expect(screen.queryByText(t.archivedIngredients(0))).not.toBeInTheDocument();
  });

  it("paginates the list", async () => {
    mockSession(USER_EMAIL);
    mockProducts(Array.from({ length: 7 }, (_, index) => productSummaryFixture({ id: `p${index}`, name: `Produto ${index + 1}` })));
    const user = userEvent.setup();
    renderApp("/products");

    await screen.findByRole("heading", { name: "Produto 1" });
    expect(cardTitles()).toHaveLength(6);
    expect(screen.getByText(t.pagination.summary(6, 7))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: messages.ingredients.pagination.page(2, 2) }));
    expect(cardTitles()).toEqual(["Produto 7"]);
  });

  it("explains what to do when the filter finds nothing and when there are no products at all", async () => {
    mockSession(USER_EMAIL);
    mockProducts([productSummaryFixture({ name: "Brigadeiro" })]);
    const user = userEvent.setup();
    const { unmount } = renderApp("/products");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    await user.type(screen.getByLabelText(t.searchLabel), "zzz");
    expect(screen.getByText(t.empty.search)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(t.searchLabel));
    await user.click(screen.getByRole("button", { name: status.archived(0) }));
    expect(screen.getByText(t.empty.archived)).toBeInTheDocument();
    unmount();

    mockProducts([]);
    renderApp("/products");
    expect(await screen.findByText(t.empty.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.empty.create })).toHaveAttribute("href", "/products/new");
  });

  it("shows an error with a retry button when the list fails to load", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/products`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/products");

    expect(await screen.findByRole("alert")).toHaveTextContent(t.loadError);

    mockProducts([productSummaryFixture({ name: "Brigadeiro" })]);
    await user.click(screen.getByRole("button", { name: t.retry }));
    expect(await screen.findByRole("heading", { name: "Brigadeiro" })).toBeInTheDocument();
  });
});

describe("archiving and restoring", () => {
  it("archives a product from its menu after confirming", async () => {
    mockSession(USER_EMAIL);
    mockProducts([productSummaryFixture({ id: "prod-1", name: "Brigadeiro" })]);
    let archived = false;
    server.use(
      http.post(`${API}/api/v1/products/prod-1/archive`, () => {
        archived = true;
        return HttpResponse.json(productFixture({ active: false }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/products");

    await user.click(await screen.findByRole("button", { name: t.actions.menu("Brigadeiro") }));
    await user.click(await screen.findByRole("menuitem", { name: t.actions.archive }));
    await user.click(await screen.findByRole("button", { name: t.archiveDialog.confirm }));

    await waitFor(() => expect(archived).toBe(true));
  });

  it("explains why archiving failed and keeps the dialog open", async () => {
    mockSession(USER_EMAIL);
    mockProducts([productSummaryFixture({ id: "prod-1", name: "Brigadeiro" })]);
    server.use(http.post(`${API}/api/v1/products/prod-1/archive`, () => problem(404, "PRODUCT_NOT_FOUND")));
    const user = userEvent.setup();
    renderApp("/products");

    await user.click(await screen.findByRole("button", { name: t.actions.menu("Brigadeiro") }));
    await user.click(await screen.findByRole("menuitem", { name: t.actions.archive }));
    await user.click(await screen.findByRole("button", { name: t.archiveDialog.confirm }));

    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Produto não encontrado.");
  });

  it("restores an archived product", async () => {
    mockSession(USER_EMAIL);
    mockProducts([productSummaryFixture({ id: "prod-1", name: "Cajuzinho", active: false })]);
    let restored = false;
    server.use(
      http.post(`${API}/api/v1/products/prod-1/restore`, () => {
        restored = true;
        return HttpResponse.json(productFixture({ id: "prod-1", active: true }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/products");

    await screen.findByText(t.empty.active);
    await user.click(screen.getByRole("button", { name: status.archived(1) }));
    expect(await screen.findByText(t.archivedTag)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.actions.restore }));

    await waitFor(() => expect(restored).toBe(true));
  });
});