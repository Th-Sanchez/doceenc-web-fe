import type { Ingredient } from "@/api/types";

export type SortKey = "name" | "variation" | "recent";

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Lowercase and accent-free, so "acucar" finds "Açúcar". */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function availableIngredients(all: Ingredient[], showArchived: boolean): Ingredient[] {
  return showArchived ? all : all.filter((ingredient) => ingredient.active);
}

/** Category chip counters: they follow the archived toggle but not the search, so the chips stay stable while typing. */
export function countByCategory(items: Ingredient[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { category } of items) {
    counts.set(category.id, (counts.get(category.id) ?? 0) + 1);
  }
  return counts;
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

export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: current, pageCount, total: items.length };
}