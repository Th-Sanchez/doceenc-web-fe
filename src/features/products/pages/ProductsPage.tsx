import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { MarginStatus, ProductSummary } from "@/api/types";
import { Chip } from "@/components/Chip";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { StatusSwitch } from "@/features/recipes/components/StatusSwitch";
import { messageForError, messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";
import {
  filterProducts,
  paginate,
  type ProductSortKey,
  type ProductStatus,
  productsByStatus,
  sortProducts,
  statusChips,
} from "../catalog";
import { ArchiveProductDialog } from "../components/ArchiveProductDialog";
import { ProductGrid } from "../components/ProductList";
import { useProducts, useRestoreProduct } from "../queries";

const PAGE_SIZE = 6;
const t = messages.products;

function ListSkeleton() {
  return (
    <div role="status" aria-label={messages.loading} className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-72 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function ProductsPage() {
  const products = useProducts();
  const restore = useRestoreProduct();

  const [search, setSearch] = useState("");
  const [situation, setSituation] = useState<MarginStatus | null>(null);
  const [status, setStatus] = useState<ProductStatus>("active");
  // the most urgent first: that is what this screen is for
  const [sort, setSort] = useState<ProductSortKey>("attention");
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<ProductSummary | null>(null);

  const all = products.data;
  const inStatus = useMemo(() => productsByStatus(all ?? [], status), [all, status]);
  const chips = useMemo(() => statusChips(inStatus), [inStatus]);
  // the selected chip can disappear (its only product was fixed, archived or restored): fall back to "all"
  const activeSituation = chips.some((chip) => chip.status === situation) ? situation : null;

  const visible = useMemo(
    () => sortProducts(filterProducts(inStatus, { search, status: activeSituation }), sort),
    [inStatus, search, activeSituation, sort],
  );
  const current = paginate(visible, page, PAGE_SIZE);

  // every filter change goes back to the first page
  const onSearch = (value: string) => { setSearch(value); setPage(1); };
  const onSituation = (value: MarginStatus | null) => { setSituation(value); setPage(1); };
  const onStatus = (value: ProductStatus) => { setStatus(value); setPage(1); };
  const onSort = (value: ProductSortKey) => { setSort(value); setPage(1); };

  const activeCount = all?.filter((product) => product.active).length ?? 0;
  const archivedCount = (all?.length ?? 0) - activeCount;
  const listProps = {
    items: current.items,
    onArchive: setToArchive,
    onRestore: (product: ProductSummary) => restore.mutate(product.id),
    restoring: restore.isPending,
  };
  const filtered = search.trim() !== "" || activeSituation !== null;
  const emptyMessage = filtered ? t.empty.search : status === "archived" ? t.empty.archived : t.empty.active;

  return (
    <div className="flex flex-col gap-6">
      <header className="hidden flex-wrap items-start justify-between gap-3 lg:flex">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">{t.title}</h1>
            {all && (
              <span className="rounded-full bg-[#f9d8d2] px-2.5 py-1 text-xs font-semibold text-[#765d58]">
                {t.count(activeCount)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Link to="/products/new" className={buttonVariants()}>
          <Plus aria-hidden className="size-4" />
          {t.new}
        </Link>
      </header>

      {products.isPending && <ListSkeleton />}

      {products.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{t.loadError}</p>
          <Button variant="outline" onClick={() => products.refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {all && all.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
          <p className="text-lg font-semibold">{t.empty.title}</p>
          <p className="text-sm text-muted-foreground">{t.empty.description}</p>
          <Link to="/products/new" className={buttonVariants()}>
            <Plus aria-hidden className="size-4" />
            {t.empty.create}
          </Link>
        </div>
      )}

      {all && all.length > 0 && (
        <>
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="search"
                  aria-label={t.searchLabel}
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(event) => onSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
              <StatusSwitch
                status={status}
                activeCount={activeCount}
                archivedCount={archivedCount}
                onChange={onStatus}
              />
              <div className="hidden items-center gap-2 md:flex">
                <Label
                  htmlFor="product-sort"
                  className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t.sortLabel}
                </Label>
                <Select
                  id="product-sort"
                  value={sort}
                  onChange={(event) => onSort(event.target.value as ProductSortKey)}
                  className="md:w-56"
                >
                  <option value="attention">{t.sort.attention}</option>
                  <option value="name">{t.sort.name}</option>
                  <option value="cost">{t.sort.cost}</option>
                </Select>
              </div>
            </div>
            <div
              role="group"
              aria-label={t.statusFilter}
              className={cn("flex min-w-0 gap-2 overflow-x-auto border-t pt-3 pb-1 md:flex-wrap")}
            >
              <Chip selected={activeSituation === null} onClick={() => onSituation(null)}>
                {`${t.allStatuses} (${inStatus.length})`}
              </Chip>
              {chips.map((chip) => (
                <Chip key={chip.status} selected={activeSituation === chip.status} onClick={() => onSituation(chip.status)}>
                  {`${t.status[chip.status]} (${chip.count})`}
                </Chip>
              ))}
            </div>
          </div>

          {restore.isError && (
            <p role="alert" className="text-sm text-destructive">
              {messageForError(restore.error)}
            </p>
          )}

          {visible.length === 0 ? (
            <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{emptyMessage}</p>
          ) : (
            <>
              <ProductGrid {...listProps} />
              <Pagination
                page={current.page}
                pageCount={current.pageCount}
                shown={current.items.length}
                total={current.total}
                summary={t.pagination.summary}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}

      <ArchiveProductDialog product={toArchive} onClose={() => setToArchive(null)} />
      <Link to="/products/new" className={cn(buttonVariants(), "fixed bottom-19 right-4 z-20 shadow-lg lg:hidden")}>
        <Plus aria-hidden className="size-4" />
        {t.new}
      </Link>
    </div>
  );
}