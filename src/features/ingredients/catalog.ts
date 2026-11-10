import type { Ingredient } from "@/api/types";
import { collator, normalizeText } from "@/lib/catalog";

export { categoryChips, normalizeText, paginate } from "@/lib/catalog";
export type { CategoryChip, Page } from "@/lib/catalog";

export type SortKey = "name" | "variation" | "recent";

export function availableIngredients(all: Ingredient[], showArchived: boolean): Ingredient[] {
  return showArchived ? all : all.filter((ingredient) => ingredient.active);
}

export function filterIngredients(
  items: Ingredient[],
  { search, categoryId }: { search: string; categoryId: string | null },
): Ingredient[] {
  const term = normalizeText(search.trim());
  return items.filter((ingredient) => {
    if (categoryId !== null && ingredient.category.id !== categoryId) return false;
    if (term === "") return true;
    return normalizeText(`${ingredient.name} ${ingredient.brandSupplier ?? ""}`).includes(term);
  });
}

/** Descending order with missing values last. */
function compareDescNullsLast<T>(a: T | null | undefined, b: T | null | undefined, diff: (x: T, y: T) => number) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return diff(b, a);
}

const byName = (a: Ingredient, b: Ingredient) => collator.compare(a.name, b.name);

const comparators: Record<SortKey, (a: Ingredient, b: Ingredient) => number> = {
  name: byName,
  // "Maior variação" = biggest price increase first
  variation: (a, b) =>
    compareDescNullsLast(a.variationPercent, b.variationPercent, (x, y) => x - y) || byName(a, b),
  // ISO dates compare correctly as strings
  recent: (a, b) =>
    compareDescNullsLast(a.lastPurchasedOn, b.lastPurchasedOn, (x, y) => x.localeCompare(y)) || byName(a, b),
};

export function sortIngredients(items: Ingredient[], sort: SortKey): Ingredient[] {
  return [...items].sort(comparators[sort]);
}

/** An archived ingredient with the same identity (name + brand, case-insensitive), as the server sees it. */
export function findArchivedTwin(items: Ingredient[], name: string, brandSupplier: string): Ingredient | null {
  const key = (n: string, b: string | null) => `${n.trim().toLowerCase()}|${(b ?? "").trim().toLowerCase()}`;
  const wanted = key(name, brandSupplier);
  return items.find((ingredient) => !ingredient.active && key(ingredient.name, ingredient.brandSupplier) === wanted) ?? null;
}