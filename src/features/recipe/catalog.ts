import type { RecipeSummary } from "@/api/types";
import { collator, normalizeText } from "@/lib/catalog";

export { categoryChips, paginate } from "@/lib/catalog";

export type RecipeStatus = "active" | "archived";
export type RecipeSortKey = "name" | "cost" | "unitCost" | "recent";

/** Unlike ingredients, the status is exclusive: the design has an "Ativas | Arquivadas" switch. */
export function recipesByStatus(all: RecipeSummary[], status: RecipeStatus): RecipeSummary[] {
  return all.filter((recipe) => recipe.active === (status === "active"));
}

/** The list does not carry the items, so search is by recipe name only. */
export function filterRecipes(
  items: RecipeSummary[],
  { search, categoryId }: { search: string; categoryId: string | null },
): RecipeSummary[] {
  const term = normalizeText(search.trim());
  return items.filter((recipe) => {
    if (categoryId !== null && recipe.category.id !== categoryId) return false;
    return term === "" || normalizeText(recipe.name).includes(term);
  });
}

const byName = (a: RecipeSummary, b: RecipeSummary) => collator.compare(a.name, b.name);

const comparators: Record<RecipeSortKey, (a: RecipeSummary, b: RecipeSummary) => number> = {
  name: byName,
  // most expensive first
  cost: (a, b) => b.totalCost - a.totalCost || byName(a, b),
  unitCost: (a, b) => b.costPerYieldUnit - a.costPerYieldUnit || byName(a, b),
  // instants have a variable number of fraction digits, so they are parsed instead of compared as text
  recent: (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || byName(a, b),
};

export function sortRecipes(items: RecipeSummary[], sort: RecipeSortKey): RecipeSummary[] {
  return [...items].sort(comparators[sort]);
}