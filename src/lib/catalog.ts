export const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Lowercase and accent-free, so "acucar" finds "Açúcar". */
export function normalizeText(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export interface CategoryChip {
  id: string;
  name: string;
  count: number;
}

/** Chips are built from whatever list the caller already narrowed (status), but not from the search. */
export function categoryChips<T extends { category: { id: string; name: string } }>(items: T[]): CategoryChip[] {
  const chips = new Map<string, CategoryChip>();
  for (const { category } of items) {
    const chip = chips.get(category.id) ?? { id: category.id, name: category.name, count: 0 };
    chip.count += 1;
    chips.set(category.id, chip);
  }
  return [...chips.values()].sort((a, b) => collator.compare(a.name, b.name));
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