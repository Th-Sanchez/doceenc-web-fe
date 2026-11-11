import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { mockRecipes, recipeFixture, recipeSummaryFixture } from "@/test/recipe";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";
import { mockViewport } from "@/test/viewport";

const t = messages.recipes;

const cardTitles = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

describe("recipes list", () => {
  it("lists active recipes first, with the counts of each status", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([
      recipeSummaryFixture({ id: "a", name: "Brigadeiro" }),
      recipeSummaryFixture({ id: "b", name: "Beijinho" }),
      recipeSummaryFixture({ id: "c", name: "Cajuzinho", active: false }),
    ]);
    renderApp("/recipes");

    expect(await screen.findByRole("heading", { name: "Brigadeiro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Beijinho" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cajuzinho" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.status.active(2) })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: t.status.archived(1) })).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the cost of the batch and of each unit, the yield and the shelf life", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockRecipes([recipeSummaryFixture({ name: "Brigadeiro", totalCost: 11.8, costPerYieldUnit: 0.25, itemCount: 3 })]);
    renderApp("/recipes");

    const card = (await screen.findByRole("heading", { name: "Brigadeiro" })).closest("li") as HTMLElement;
    expect(within(card).getByText(/R\$\s11,80/)).toBeInTheDocument();
    expect(within(card).getByText(/R\$\s0,25/)).toBeInTheDocument();
    expect(within(card).getByText(t.yield("40 un"))).toBeInTheDocument();
    expect(within(card).getByText(t.shelfLife(5))).toBeInTheDocument();
    expect(within(card).getByText(t.ingredientCount(3))).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: t.viewSheet })).toHaveAttribute("href", "/recipes/rec-1");
  });

  it("opens the sheet from the whole compact card on small screens", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([recipeSummaryFixture({ id: "rec-9", name: "Brigadeiro" })]);
    renderApp("/recipes");

    expect(await screen.findByRole("link", { name: "Brigadeiro" })).toHaveAttribute("href", "/recipes/rec-9");
  });

  it("filters by name ignoring accents and by category, with chips following the status", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([
      recipeSummaryFixture({ id: "a", name: "Torta de Maçã", category: { id: "c2", name: "Tortas" } }),
      recipeSummaryFixture({ id: "b", name: "Brigadeiro" }),
      recipeSummaryFixture({ id: "c", name: "Beijinho" }),
      recipeSummaryFixture({ id: "d", name: "Bolo antigo", category: { id: "c3", name: "Bolos" }, active: false }),
    ]);
    const user = userEvent.setup();
    renderApp("/recipes");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    expect(screen.getByRole("button", { name: `${t.allCategories} (3)` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Doces (2)" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Bolos (1)" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(t.searchLabel), "maca");
    expect(cardTitles()).toEqual(["Torta de Maçã"]);

    await user.clear(screen.getByLabelText(t.searchLabel));
    await user.click(screen.getByRole("button", { name: "Doces (2)" }));
    expect(cardTitles()).toEqual(["Beijinho", "Brigadeiro"]);

    await user.click(screen.getByRole("button", { name: t.status.archived(1) }));
    expect(cardTitles()).toEqual(["Bolo antigo"]);
    expect(screen.getByRole("button", { name: "Bolos (1)" })).toBeInTheDocument();
  });

  it("sorts by the chosen criterion", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([
      recipeSummaryFixture({ id: "a", name: "Bolo", totalCost: 50 }),
      recipeSummaryFixture({ id: "b", name: "Torta", totalCost: 80 }),
      recipeSummaryFixture({ id: "c", name: "Açaí", totalCost: 20 }),
    ]);
    const user = userEvent.setup();
    renderApp("/recipes");

    await screen.findByRole("heading", { name: "Bolo" });
    expect(cardTitles()).toEqual(["Açaí", "Bolo", "Torta"]);

    await user.selectOptions(screen.getByLabelText(t.sortLabel), "cost");
    expect(cardTitles()).toEqual(["Torta", "Bolo", "Açaí"]);
  });

  it("warns when a recipe still uses archived ingredients", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([
      recipeSummaryFixture({ id: "a", name: "Brigadeiro", archivedIngredientCount: 2 }),
      recipeSummaryFixture({ id: "b", name: "Beijinho", archivedIngredientCount: 0 }),
    ]);
    renderApp("/recipes");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    expect(screen.getAllByText(t.archivedIngredients(2))).toHaveLength(1);
    expect(screen.queryByText(t.archivedIngredients(0))).not.toBeInTheDocument();
  });

  it("paginates the list", async () => {
    mockSession(USER_EMAIL);
    mockRecipes(Array.from({ length: 7 }, (_, index) => recipeSummaryFixture({ id: `r${index}`, name: `Receita ${index + 1}` })));
    const user = userEvent.setup();
    renderApp("/recipes");

    await screen.findByRole("heading", { name: "Receita 1" });
    expect(cardTitles()).toHaveLength(6);
    expect(screen.getByText(t.pagination.summary(6, 7))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: messages.ingredients.pagination.page(2, 2) }));
    expect(cardTitles()).toEqual(["Receita 7"]);
  });

  it("explains what to do when the filter finds nothing and when there are no recipes at all", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([recipeSummaryFixture({ name: "Brigadeiro" })]);
    const user = userEvent.setup();
    const { unmount } = renderApp("/recipes");

    await screen.findByRole("heading", { name: "Brigadeiro" });
    await user.type(screen.getByLabelText(t.searchLabel), "zzz");
    expect(screen.getByText(t.empty.search)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(t.searchLabel));
    await user.click(screen.getByRole("button", { name: t.status.archived(0) }));
    expect(screen.getByText(t.empty.archived)).toBeInTheDocument();
    unmount();

    mockRecipes([]);
    renderApp("/recipes");
    expect(await screen.findByText(t.empty.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.empty.create })).toHaveAttribute("href", "/recipes/new");
  });

  it("shows an error with a retry button when the list fails to load", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/recipes`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/recipes");

    expect(await screen.findByRole("alert")).toHaveTextContent(t.loadError);

    mockRecipes([recipeSummaryFixture({ name: "Brigadeiro" })]);
    await user.click(screen.getByRole("button", { name: t.retry }));
    expect(await screen.findByRole("heading", { name: "Brigadeiro" })).toBeInTheDocument();
  });
});

describe("archiving and restoring", () => {
  it("archives a recipe from its menu after confirming", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockRecipes([recipeSummaryFixture({ id: "rec-1", name: "Brigadeiro" })]);
    let archived = false;
    server.use(
      http.post(`${API}/api/v1/recipes/rec-1/archive`, () => {
        archived = true;
        return HttpResponse.json(recipeFixture({ active: false }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/recipes");

    await user.click(await screen.findByRole("button", { name: t.actions.menu("Brigadeiro") }));
    await user.click(await screen.findByRole("menuitem", { name: t.actions.archive }));
    await user.click(await screen.findByRole("button", { name: t.archiveDialog.confirm }));

    await waitFor(() => expect(archived).toBe(true));
  });

  it("explains why archiving failed and keeps the dialog open", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockRecipes([recipeSummaryFixture({ id: "rec-1", name: "Brigadeiro" })]);
    server.use(http.post(`${API}/api/v1/recipes/rec-1/archive`, () => problem(404, "RECIPE_NOT_FOUND")));
    const user = userEvent.setup();
    renderApp("/recipes");

    await user.click(await screen.findByRole("button", { name: t.actions.menu("Brigadeiro") }));
    await user.click(await screen.findByRole("menuitem", { name: t.actions.archive }));
    await user.click(await screen.findByRole("button", { name: t.archiveDialog.confirm }));

    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Receita não encontrada.");
  });

  it("restores an archived recipe", async () => {
    mockSession(USER_EMAIL);
    mockRecipes([recipeSummaryFixture({ id: "rec-1", name: "Cajuzinho", active: false })]);
    let restored = false;
    server.use(
      http.post(`${API}/api/v1/recipes/rec-1/restore`, () => {
        restored = true;
        return HttpResponse.json(recipeFixture({ id: "rec-1", active: true }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/recipes");

    await screen.findByText(t.empty.active);
    await user.click(screen.getByRole("button", { name: t.status.archived(1) }));
    expect(await screen.findByText(t.archivedTag)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t.actions.restore }));

    await waitFor(() => expect(restored).toBe(true));
  });
});