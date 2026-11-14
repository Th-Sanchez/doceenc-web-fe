import type { MarginStatus, ProductSummary } from "@/api/types";
import { collator, normalizeText } from "@/lib/catalog";

export { paginate } from "@/lib/catalog";

export type ProductStatus = "active" | "archived";
export type ProductSortKey = "name" | "attention" | "cost";

/** What needs action first. NO_PRICE is not bad, but it is unfinished, so it comes before ON_TARGET. */
export const STATUS_ORDER: readonly MarginStatus[] = ["LOSS", "BELOW_TARGET", "NO_PRICE", "ON_TARGET"];

const RANK: Record<MarginStatus, number> = { LOSS: 0, BELOW_TARGET: 1, NO_PRICE: 2, ON_TARGET: 3 };

/**
 * One status per product, so the list filters add up. Only channels that have a price count:
 * the wholesale price is optional, and a retail-only product must not look unfinished forever.
 * A product is NO_PRICE only when it has no price at all.
 */
export function overallStatus({ retail, wholesale }: Pick<ProductSummary, "retail" | "wholesale">): MarginStatus {
  const priced = [retail.status, wholesale.status].filter((status) => status !== "NO_PRICE");
  if (priced.length === 0) return "NO_PRICE";
  return priced.reduce((worst, status) => (RANK[status] < RANK[worst] ? status : worst));
}

export function productsByStatus(all: ProductSummary[], status: ProductStatus): ProductSummary[] {
  return all.filter((product) => product.active === (status === "active"));
}

/** Search matches the product name or the name of its recipe. */
export function filterProducts(
  items: ProductSummary[],
  { search, status }: { search: string; status: MarginStatus | null },
): ProductSummary[] {
  const term = normalizeText(search.trim());
  return items.filter((product) => {
    if (status !== null && overallStatus(product) !== status) return false;
    return (
      term === "" ||
      normalizeText(product.name).includes(term) ||
      normalizeText(product.recipe.name).includes(term)
    );
  });
}

/** Chips for the statuses that exist in the list, in attention order. */
export function statusChips(items: ProductSummary[]): { status: MarginStatus; count: number }[] {
  const counts = new Map<MarginStatus, number>();
  for (const product of items) {
    const status = overallStatus(product);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return STATUS_ORDER.filter((status) => counts.has(status)).map((status) => ({
    status,
    count: counts.get(status) ?? 0,
  }));
}

const byName = (a: ProductSummary, b: ProductSummary) => collator.compare(a.name, b.name);

const comparators: Record<ProductSortKey, (a: ProductSummary, b: ProductSummary) => number> = {
  name: byName,
  attention: (a, b) => RANK[overallStatus(a)] - RANK[overallStatus(b)] || byName(a, b),
  // most expensive first
  cost: (a, b) => b.cost.totalCost - a.cost.totalCost || byName(a, b),
};

export function sortProducts(items: ProductSummary[], sort: ProductSortKey): ProductSummary[] {
  return [...items].sort(comparators[sort]);
}