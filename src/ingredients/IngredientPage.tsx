import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { Ingredient } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { messageForError, messages } from "@/i18n/messages";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { ArchiveDialog } from "./ArchiveDialog";
import {
  availableIngredients, categoryChips, filterIngredients, paginate, sortIngredients, type SortKey,
} from "./catalog";
import { IngredientCards, IngredientTable } from "./IngredientList";
import { Pagination } from "./Pagination";
import { useIngredients, useRestoreIngredient } from "./queries";

const PAGE_SIZE = 6;
const t = messages.ingredients;

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label={messages.loading} className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function IngredientsPage() {
  const ingredients = useIngredients();
  const restore = useRestoreIngredient();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<Ingredient | null>(null);

  const all = ingredients.data;
  const available = useMemo(() => availableIngredients(all ?? [], showArchived), [all, showArchived]);
  const chips = useMemo(() => categoryChips(available), [available]);
  // the selected chip can disappear (e.g. its only ingredient was archived): fall back to "all"
  const activeCategory = chips.some((chip) => chip.id === categoryId) ? categoryId : null;

  const visible = useMemo(
    () => sortIngredients(filterIngredients(available, { search, categoryId: activeCategory }), sort),
    [available, search, activeCategory, sort],
  );
  const current = paginate(visible, page, PAGE_SIZE);

  // every filter change goes back to the first page
  const onSearch = (value: string) => { setSearch(value); setPage(1); };
  const onCategory = (value: string | null) => { setCategoryId(value); setPage(1); };
  const onShowArchived = (value: boolean) => { setShowArchived(value); setPage(1); };
  const onSort = (value: SortKey) => { setSort(value); setPage(1); };

  const activeCount = all?.filter((ingredient) => ingredient.active).length ?? 0;
  const listProps = {
    items: current.items,
    onArchive: setToArchive,
    onRestore: (ingredient: Ingredient) => restore.mutate(ingredient.id),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-primary">{t.title}</h1>
          {all && (
            <span className="rounded-full bg-[#f9d8d2] px-2.5 py-1 text-xs font-semibold text-[#765d58]">
              {t.count(activeCount)}
            </span>
          )}
        </div>
        <Link to="/ingredients/new" className={buttonVariants()}>
          <Plus aria-hidden className="size-4" />
          {t.new}
        </Link>
      </header>

      {ingredients.isPending && <ListSkeleton />}

      {ingredients.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{t.loadError}</p>
          <Button variant="outline" onClick={() => ingredients.refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {all && all.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
          <p className="text-lg font-semibold">{t.empty.title}</p>
          <p className="text-sm text-muted-foreground">{t.empty.description}</p>
          <Link to="/ingredients/new" className={buttonVariants()}>
            <Plus aria-hidden className="size-4" />
            {t.new}
          </Link>
        </div>
      )}

      {all && all.length > 0 && (
        <>
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-52 flex-1">
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
              <div className="flex items-center gap-2">
                <Switch id="show-archived" checked={showArchived} onCheckedChange={onShowArchived} />
                <Label htmlFor="show-archived">{t.showArchived}</Label>
              </div>
              <Select
                aria-label={t.sortLabel}
                value={sort}
                onChange={(event) => onSort(event.target.value as SortKey)}
                className="md:w-56"
              >
                <option value="name">{t.sort.name}</option>
                <option value="variation">{t.sort.variation}</option>
                <option value="recent">{t.sort.recent}</option>
              </Select>
            </div>
            <div role="group" aria-label={t.categories} className="flex flex-wrap gap-2">
              <Chip selected={activeCategory === null} onClick={() => onCategory(null)}>
                {`${t.allCategories} (${available.length})`}
              </Chip>
              {chips.map((chip) => (
                <Chip key={chip.id} selected={activeCategory === chip.id} onClick={() => onCategory(chip.id)}>
                  {`${chip.name} (${chip.count})`}
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
            <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t.empty.search}</p>
          ) : (
            <>
              {isDesktop ? <IngredientTable {...listProps} /> : <IngredientCards {...listProps} />}
              <Pagination
                page={current.page}
                pageCount={current.pageCount}
                shown={current.items.length}
                total={current.total}
                onChange={setPage}
              />
            </>
          )}
        </>
      )}

      <ArchiveDialog ingredient={toArchive} onClose={() => setToArchive(null)} />
    </div>
  );
}