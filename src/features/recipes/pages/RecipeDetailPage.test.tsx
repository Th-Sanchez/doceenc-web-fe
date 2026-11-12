import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { Recipe } from "@/api/types";
import { messages } from "@/i18n/messages";
import { formatMoney } from "@/lib/format";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { mockRecipe, recipeFixture } from "@/test/recipe";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";
import { mockViewport } from "@/test/viewport";
import { formatRecipeUnitCostWithUnit } from "../format";

const t = messages.recipeSheet;

/**
 * Intl puts a no-break space between "R$" and the number. Testing Library collapses whitespace in the
 * text of the page but not in the string we search for, so the expected text gets the same treatment.
 */
const plain = (text: string) => text.replace(/\s+/g, " ");

const items: Recipe["items"] = [
  {
    ingredient: { id: "ing-1", name: "Leite condensado", brandSupplier: "Moça", baseUnit: "GRAM", active: true, unitPrice: 0.02 },
    quantity: 395,
    cost: 7.9,
  },
  {
    ingredient: { id: "ing-2", name: "Manteiga", brandSupplier: "Itambé", baseUnit: "GRAM", active: false, unitPrice: 0.06 },
    quantity: 20,
    cost: 1.2,
  },
];

const sheet = (overrides: Partial<Recipe> = {}) =>
  recipeFixture({ id: "rec-1", name: "Brigadeiro", items, totalCost: 9.1, costPerYieldUnit: 0.2275, ...overrides });

describe("recipe sheet", () => {
  it("shows the facts, the composition and the cost summary exactly as the server priced them", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockRecipe(sheet());
    renderApp("/recipes/rec-1");

    expect(await screen.findByRole("heading", { level: 1, name: "Brigadeiro" })).toBeInTheDocument();
    expect(screen.getByText("40 un")).toBeInTheDocument();
    expect(screen.getByText("45 min")).toBeInTheDocument();
    expect(screen.getByText(t.days(5))).toBeInTheDocument();
    expect(screen.getByText(t.itemsCount(2))).toBeInTheDocument();

    const active = screen.getByRole("row", { name: /Leite condensado/ });
    expect(within(active).getByText("395 g")).toBeInTheDocument();
    expect(within(active).getByText(/R\$\s0,0200 \/ g/)).toBeInTheDocument();
    expect(within(active).getByText(/R\$\s7,90/)).toBeInTheDocument();
    expect(within(active).getByText(t.composition.active)).toBeInTheDocument();
    expect(within(screen.getByRole("row", { name: /Manteiga/ })).getByText(t.composition.archived)).toBeInTheDocument();

    expect(screen.getByText(plain(formatMoney(9.1)))).toBeInTheDocument();
    expect(screen.getByText(plain(formatRecipeUnitCostWithUnit(0.2275, "UNIT")))).toBeInTheDocument();
    expect(screen.getByText(plain(t.summary.calculatedBy(formatMoney(9.1), "40 un")))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.edit })).toHaveAttribute("href", "/recipes/rec-1/edit");
  });

  it("warns that an ingredient of an active recipe was archived", async () => {
    mockSession(USER_EMAIL);
    mockRecipe(sheet());
    renderApp("/recipes/rec-1");

    expect(await screen.findByText(messages.recipes.archivedIngredients(1))).toBeInTheDocument();
  });

  it("lists the composition as cards on small screens", async () => {
    mockSession(USER_EMAIL);
    mockRecipe(sheet());
    renderApp("/recipes/rec-1");

    expect(await screen.findByText("Leite condensado")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an archived recipe as read-only and restores it", async () => {
    mockSession(USER_EMAIL);
    mockRecipe(sheet({ active: false }));
    let restored = false;
    server.use(
      http.post(`${API}/api/v1/recipes/rec-1/restore`, () => {
        restored = true;
        return HttpResponse.json(sheet({ active: true }));
      }),
    );
    const user = userEvent.setup();
    renderApp("/recipes/rec-1");

    expect(await screen.findByText(t.archivedBanner)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: t.edit })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.restore }));

    await waitFor(() => expect(restored).toBe(true));
    expect(await screen.findByRole("link", { name: t.edit })).toBeInTheDocument();
    expect(screen.queryByText(t.archivedBanner)).not.toBeInTheDocument();
  });

  it("archives the recipe after confirming and then shows it as archived", async () => {
    mockViewport(true);
    mockSession(USER_EMAIL);
    mockRecipe(sheet());
    server.use(http.post(`${API}/api/v1/recipes/rec-1/archive`, () => HttpResponse.json(sheet({ active: false }))));
    const user = userEvent.setup();
    renderApp("/recipes/rec-1");

    await user.click(await screen.findByRole("button", { name: t.archive }));
    await user.click(await screen.findByRole("button", { name: messages.recipes.archiveDialog.confirm }));

    expect(await screen.findByText(t.archivedBanner)).toBeInTheDocument();
  });

  it("says when the recipe does not exist", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/recipes/rec-x`, () => problem(404, "RECIPE_NOT_FOUND")));
    renderApp("/recipes/rec-x");

    expect(await screen.findByText(messages.recipeForm.notFound)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.recipeForm.backToList })).toHaveAttribute("href", "/recipes");
  });

  it("shows an error with a retry button when the recipe fails to load", async () => {
    mockSession(USER_EMAIL);
    server.use(http.get(`${API}/api/v1/recipes/rec-1`, () => problem(500, "INTERNAL_ERROR")));
    const user = userEvent.setup();
    renderApp("/recipes/rec-1");

    expect(await screen.findByRole("alert")).toHaveTextContent(messages.recipes.loadError);

    mockRecipe(sheet());
    await user.click(screen.getByRole("button", { name: messages.recipes.retry }));
    expect(await screen.findByRole("heading", { level: 1, name: "Brigadeiro" })).toBeInTheDocument();
  });
});