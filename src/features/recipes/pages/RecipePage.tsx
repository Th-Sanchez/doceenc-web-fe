import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { RecipeSummary } from "@/api/types";
import { Chip } from "@/components/Chip";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { messageForError, messages } from "@/i18n/messages";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import {
  categoryChips,
  filterRecipes,
  paginate,
  recipesByStatus,
  sortRecipes,
  type RecipeSortKey,
  type RecipeStatus,
} from "../catalog";
import { ArchiveRecipeDialog } from "../components/ArchiveRecipeDialog";
import { RecipeCompactList, RecipeGrid } from "../components/RecipeList";
import { StatusSwitch } from "../components/StatusSwitch";
import { useRecipes, useRestoreRecipe } from "../queries";

const PAGE_SIZE = 6;
const t = messages.recipes;

function ListSkeleton() {
  return (
    <div role="status" aria-label={messages.loading} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-64 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export function RecipesPage() {
  const recipes = useRecipes();
  const restore = useRestoreRecipe();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<RecipeStatus>("active");
  const [sort, setSort] = useState<RecipeSortKey>("name");
  const [page, setPage] = useState(1);
  const [toArchive, setToArchive] = useState<RecipeSummary | null>(null);

  const all = recipes.data;
  const inStatus = useMemo(() => recipesByStatus(all ?? [], status), [all, status]);
  const chips = useMemo(() => categoryChips(inStatus), [inStatus]);
  // the selected chip can disappear (its only recipe was archived or restored): fall back to "all"
  const activeCategory = chips.some((chip) => chip.id === categoryId) ? categoryId : null;

  const visible = useMemo(
    () => sortRecipes(filterRecipes(inStatus, { search, categoryId: activeCategory }), sort),
    [inStatus, search, activeCategory, sort],
  );
  const current = paginate(visible, page, PAGE_SIZE);

  // every filter change goes back to the first page
  const onSearch = (value: string) => { setSearch(value); setPage(1); };
  const onCategory = (value: string | null) => { setCategoryId(value); setPage(1); };
  const onStatus = (value: RecipeStatus) => { setStatus(value); setPage(1); };
  const onSort = (value: RecipeSortKey) => { setSort(value); setPage(1); };

  const activeCount = all?.filter((recipe) => recipe.active).length ?? 0;
  const archivedCount = (all?.length ?? 0) - activeCount;
  const listProps = {
    items: current.items,
    onArchive: setToArchive,
    onRestore: (recipe: RecipeSummary) => restore.mutate(recipe.id),
    restoring: restore.isPending,
  };
  const filtered = search.trim() !== "" || activeCategory !== null;
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
        <Link to="/recipes/new" className={buttonVariants()}>
          <Plus aria-hidden className="size-4" />
          {t.new}
        </Link>
      </header>

      {recipes.isPending && <ListSkeleton />}

      {recipes.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>{t.loadError}</p>
          <Button variant="outline" onClick={() => recipes.refetch()}>
            {t.retry}
          </Button>
        </div>
      )}

      {all && all.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center">
          <p className="text-lg font-semibold">{t.empty.title}</p>
          <p className="text-sm text-muted-foreground">{t.empty.description}</p>
          <Link to="/recipes/new" className={buttonVariants()}>
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
              {/* the mobile design has no sorting: it only appears from tablet up */}
              <div className="hidden items-center gap-2 md:flex">
                <Label
                  htmlFor="recipe-sort"
                  className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {t.sortLabel}
                </Label>
                <Select
                  id="recipe-sort"
                  value={sort}
                  onChange={(event) => onSort(event.target.value as RecipeSortKey)}
                  className="md:w-56"
                >
                  <option value="name">{t.sort.name}</option>
                  <option value="cost">{t.sort.cost}</option>
                  <option value="unitCost">{t.sort.unitCost}</option>
                  <option value="recent">{t.sort.recent}</option>
                </Select>
              </div>
            </div>
            <div
              role="group"
              aria-label={t.categoryFilter}
              className={cn("flex min-w-0 gap-2 overflow-x-auto border-t pt-3 pb-1 md:flex-wrap")}
            >
              <Chip selected={activeCategory === null} onClick={() => onCategory(null)}>
                {`${t.allCategories} (${inStatus.length})`}
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
            <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{emptyMessage}</p>
          ) : (
            <>
              {isDesktop ? <RecipeGrid {...listProps} /> : <RecipeCompactList {...listProps} />}
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

      <ArchiveRecipeDialog recipe={toArchive} onClose={() => setToArchive(null)} />
      <Link to="/recipes/new" className={cn(buttonVariants(), "fixed bottom-19 right-4 z-20 shadow-lg lg:hidden")}>
        <Plus aria-hidden className="size-4" />
        {t.new}
      </Link>
    </div>
  );
}