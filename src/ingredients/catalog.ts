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

export interface CategoryChip {
  id: string;
  name: string;
  count: number;
}

/** Chips follow the archived toggle but not the search, so they stay stable while typing. */
export function categoryChips(items: Ingredient[]): CategoryChip[] {
  const chips = new Map<string, CategoryChip>();
  for (const { category } of items) {
    const chip = chips.get(category.id) ?? { id: category.id, name: category.name, count: 0 };
    chip.count += 1;
    chips.set(category.id, chip);
  }
  return [...chips.values()].sort((a, b) => collator.compare(a.name, b.name));
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

/** An archived ingredient with the same identity (name + brand, case-insensitive), as the server sees it. */
export function findArchivedTwin(items: Ingredient[], name: string, brandSupplier: string): Ingredient | null {
  const key = (n: string, b: string | null) => `${n.trim().toLowerCase()}|${(b ?? "").trim().toLowerCase()}`;
  const wanted = key(name, brandSupplier);
  return items.find((ingredient) => !ingredient.active && key(ingredient.name, ingredient.brandSupplier) === wanted) ?? null;
}