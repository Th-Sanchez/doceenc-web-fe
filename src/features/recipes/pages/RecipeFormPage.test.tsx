import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { API, mockSession, problem, USER_EMAIL } from "@/test/api";
import { categoryFixture, ingredientFixture, mockCategories, mockIngredients } from "@/test/ingredients";
import { mockRecipe, mockSimulation, recipeFixture } from "@/test/recipe";
import { renderApp } from "@/test/render";
import { server } from "@/test/server";

const t = messages.recipeForm;

const milk = ingredientFixture({ id: "ing-1", name: "Leite condensado", brandSupplier: "Moça", unitPrice: 0.02 });
const cocoa = ingredientFixture({ id: "ing-2", name: "Cacau em pó", unitPrice: 0.09 });
const butter = ingredientFixture({ id: "ing-3", name: "Manteiga", unitPrice: 0.06, active: false });

/** Everything the form reads on mount; returns the bodies the simulation endpoint receives. */
function setup() {
  mockSession(USER_EMAIL);
  mockCategories([categoryFixture({ id: "cat-r1", name: "Doces", type: "RECIPE" })]);
  mockIngredients([milk, cocoa, butter]);
  return mockSimulation();
}

type User = ReturnType<typeof userEvent.setup>;

async function addIngredient(user: User, name: RegExp) {
  await user.click(await screen.findByRole("button", { name: t.addItem }));
  const picker = await screen.findByRole("dialog");
  await user.click(await within(picker).findByRole("button", { name }));
}

async function fillValidForm(user: User) {
  await user.type(await screen.findByLabelText(t.name), "Brigadeiro");
  await screen.findByRole("option", { name: "Doces" });
  await user.selectOptions(screen.getByLabelText(t.category), "cat-r1");
  await user.type(screen.getByLabelText(t.yield), "40");
  await addIngredient(user, /Leite condensado/);
  await user.type(await screen.findByLabelText(t.itemQuantity("Leite condensado")), "395");
}

describe("new recipe", () => {
  it("creates a recipe with the live cost and opens its sheet", async () => {
    const simulation = setup();
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/recipes`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(recipeFixture({ id: "rec-new", name: "Brigadeiro" }), { status: 201 });
      }),
    );
    mockRecipe(recipeFixture({ id: "rec-new", name: "Brigadeiro" }));
    const user = userEvent.setup();
    renderApp("/recipes/new");

    await fillValidForm(user);

    // the cost on screen is the server's answer to what was typed, after the debounce
    expect((await screen.findAllByText(/R\$\s7,90/)).length).toBeGreaterThan(0);
    await waitFor(() =>
      expect(simulation.at(-1)).toEqual({ yieldQuantity: 40, items: [{ ingredientId: "ing-1", quantity: 395 }] }),
    );

    await user.click(screen.getByRole("button", { name: t.save }));

    await waitFor(() =>
      expect(body).toEqual({
        name: "Brigadeiro",
        categoryId: "cat-r1",
        yieldQuantity: 40,
        yieldUnit: "UNIT",
        items: [{ ingredientId: "ing-1", quantity: 395 }],
      }),
    );
    expect(await screen.findByRole("heading", { level: 1, name: "Brigadeiro" })).toBeInTheDocument();
  });

  it("does not price an incomplete form and explains what is missing when saving", async () => {
    const simulation = setup();
    const user = userEvent.setup();
    renderApp("/recipes/new");

    await user.click(await screen.findByRole("button", { name: t.save }));

    expect(await screen.findByText(messages.validation.categoryRequired)).toBeInTheDocument();
    expect(screen.getByText(messages.validation.itemsRequired)).toBeInTheDocument();
    expect(screen.getAllByText(messages.validation.required).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(t.summary.waiting)).toBeInTheDocument();
    expect(simulation).toHaveLength(0);
  });

  it("puts a duplicated name on the name field", async () => {
    setup();
    server.use(http.post(`${API}/api/v1/recipes`, () => problem(409, "RECIPE_ALREADY_EXISTS")));
    const user = userEvent.setup();
    renderApp("/recipes/new");

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: t.save }));

    expect(await screen.findByText("Já existe uma receita com este nome.")).toBeInTheDocument();
  });

  it("shows the server's refusal of an archived ingredient on the ingredient list", async () => {
    setup();
    server.use(http.post(`${API}/api/v1/recipes`, () => problem(422, "ARCHIVED_INGREDIENT_NOT_ALLOWED")));
    const user = userEvent.setup();
    renderApp("/recipes/new");

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: t.save }));

    expect(
      await screen.findByText("Um dos insumos está arquivado e não pode ser adicionado à receita."),
    ).toBeInTheDocument();
  });

  it("offers only active ingredients that are not in the recipe yet", async () => {
    setup();
    const user = userEvent.setup();
    renderApp("/recipes/new");

    await user.click(await screen.findByRole("button", { name: t.addItem }));
    const picker = await screen.findByRole("dialog");
    expect(await within(picker).findByRole("button", { name: /Leite condensado/ })).toBeInTheDocument();
    expect(within(picker).getByRole("button", { name: /Cacau em pó/ })).toBeInTheDocument();
    expect(within(picker).queryByRole("button", { name: /Manteiga/ })).not.toBeInTheDocument();

    await user.type(within(picker).getByLabelText(t.picker.searchLabel), "cacau");
    expect(within(picker).queryByRole("button", { name: /Leite condensado/ })).not.toBeInTheDocument();
    await user.click(within(picker).getByRole("button", { name: /Cacau em pó/ }));

    await user.click(screen.getByRole("button", { name: t.addItem }));
    const again = await screen.findByRole("dialog");
    expect(await within(again).findByRole("button", { name: /Leite condensado/ })).toBeInTheDocument();
    expect(within(again).queryByRole("button", { name: /Cacau em pó/ })).not.toBeInTheDocument();
  });

  it("lets the user remove a line", async () => {
    setup();
    const user = userEvent.setup();
    renderApp("/recipes/new");

    await addIngredient(user, /Leite condensado/);
    await user.click(await screen.findByRole("button", { name: t.removeItem("Leite condensado") }));

    expect(screen.queryByLabelText(t.itemQuantity("Leite condensado"))).not.toBeInTheDocument();
  });
});

describe("edit recipe", () => {
  const recipe = recipeFixture({
    id: "rec-1",
    name: "Brigadeiro",
    items: [
      {
        ingredient: { id: "ing-1", name: "Leite condensado", brandSupplier: "Moça", baseUnit: "GRAM", active: true, unitPrice: 0.02 },
        quantity: 395,
        cost: 7.9,
      },
    ],
  });

  it("fills the form, locks the yield unit and saves without sending it", async () => {
    setup();
    mockRecipe(recipe);
    let body: unknown;
    server.use(
      http.put(`${API}/api/v1/recipes/rec-1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(recipe);
      }),
    );
    const user = userEvent.setup();
    renderApp("/recipes/rec-1/edit");

    expect(await screen.findByLabelText(t.name)).toHaveValue("Brigadeiro");
    expect(screen.getByLabelText(t.yield)).toHaveValue("40");
    expect(screen.getByLabelText(t.prep)).toHaveValue("45");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText(t.yieldUnitLocked)).toBeInTheDocument();
    // the options arrive after the form mounted: the select must still show the recipe's category
    await screen.findByRole("option", { name: "Doces" });
    expect(screen.getByLabelText(t.category)).toHaveValue("cat-r1");

    const quantity = await screen.findByLabelText(t.itemQuantity("Leite condensado"));
    expect(quantity).toHaveValue("395");
    await user.clear(quantity);
    await user.type(quantity, "400");
    await user.click(screen.getByRole("button", { name: t.saveChanges }));

    await waitFor(() =>
      expect(body).toEqual({
        name: "Brigadeiro",
        categoryId: "cat-r1",
        yieldQuantity: 40,
        prepTimeMinutes: 45,
        shelfLifeDays: 5,
        items: [{ ingredientId: "ing-1", quantity: 400 }],
      }),
    );
    expect(body).not.toHaveProperty("yieldUnit");
  });

  it("flags an ingredient that was archived after it entered the recipe", async () => {
    setup();
    mockRecipe(
      recipeFixture({
        id: "rec-1",
        items: [
          {
            ingredient: { id: "ing-3", name: "Manteiga", brandSupplier: null, baseUnit: "GRAM", active: false, unitPrice: 0.06 },
            quantity: 20,
            cost: 1.2,
          },
        ],
      }),
    );
    renderApp("/recipes/rec-1/edit");

    expect(await screen.findByText(t.archivedTag)).toBeInTheDocument();
    expect(await screen.findByLabelText(t.itemQuantity("Manteiga"))).toHaveValue("20");
  });

  it("asks to restore an archived recipe before editing it", async () => {
    setup();
    mockRecipe(recipeFixture({ id: "rec-1", active: false }));
    server.use(
      http.post(`${API}/api/v1/recipes/rec-1/restore`, () => HttpResponse.json(recipeFixture({ id: "rec-1", active: true }))),
    );
    const user = userEvent.setup();
    renderApp("/recipes/rec-1/edit");

    expect(await screen.findByText(t.archivedBanner.description)).toBeInTheDocument();
    expect(screen.queryByLabelText(t.name)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.archivedBanner.restore }));

    expect(await screen.findByLabelText(t.name)).toBeInTheDocument();
  });

  it("says when the recipe does not exist", async () => {
    setup();
    server.use(http.get(`${API}/api/v1/recipes/rec-x`, () => problem(404, "RECIPE_NOT_FOUND")));
    renderApp("/recipes/rec-x/edit");

    expect(await screen.findByText(t.notFound)).toBeInTheDocument();
  });
});