import { CalendarDays, ChevronRight, Clock, Hash, RotateCcw, TriangleAlert, Pencil } from "lucide-react";
import { Link } from "react-router";
import type { RecipeSummary } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messages } from "@/i18n/messages";
import { formatMoney, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatMinutes, formatRecipeUnitCost } from "../format";
import { RecipeActions } from "./RecipeActions";

interface ListProps {
  items: RecipeSummary[];
  onArchive: (recipe: RecipeSummary) => void;
  onRestore: (recipe: RecipeSummary) => void;
  restoring: boolean;
}

const t = messages.recipes;

function CategoryTag({ children }: { children: string }) {
  return (
    <span className="rounded bg-[#efeeeb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#554245]">
      {children}
    </span>
  );
}

function ArchivedTag() {
  return (
    <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
      {t.archivedTag}
    </span>
  );
}

/** Only for recipes that still use an ingredient that was archived afterwards. */
function ArchivedIngredientsAlert({ count }: { count: number }) {
  return (
    <p className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
      <TriangleAlert aria-hidden className="size-3.5 shrink-0" />
      {t.archivedIngredients(count)}
    </p>
  );
}

function Facts({ recipe }: { recipe: RecipeSummary }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {recipe.prepTimeMinutes !== null && (
        <li className="flex items-center gap-1.5">
          <Clock aria-hidden className="size-3.5" />
          {formatMinutes(recipe.prepTimeMinutes)}
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <Hash aria-hidden className="size-3.5" />
        {t.yield(formatQuantity(recipe.yieldQuantity, recipe.yieldUnit))}
      </li>
      {recipe.shelfLifeDays !== null && (
        <li className="flex items-center gap-1.5">
          <CalendarDays aria-hidden className="size-3.5" />
          {t.shelfLife(recipe.shelfLifeDays)}
        </li>
      )}
    </ul>
  );
}

function RecipeCard({ recipe, onArchive, onRestore, restoring }: ListProps & { recipe: RecipeSummary }) {
  const archived = !recipe.active;
  const warned = recipe.active && recipe.archivedIngredientCount > 0;
  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm",
        warned && "border-amber-300",
        archived && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryTag>{recipe.category.name}</CategoryTag>
          {archived && <ArchivedTag />}
        </div>
        <RecipeActions recipe={recipe} onArchive={onArchive} onRestore={onRestore} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className={cn("font-display text-xl font-semibold leading-tight", archived && "line-through")}>
          {recipe.name}
        </h2>
        <Facts recipe={recipe} />
      </div>
      {warned && <ArchivedIngredientsAlert count={recipe.archivedIngredientCount} />}
      <dl className="flex flex-col gap-2 rounded-lg bg-[#f5f3f0] p-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{t.batchCost}</dt>
          <dd className="font-bold">{formatMoney(recipe.totalCost)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t pt-2">
          <dt className="text-muted-foreground">{t.unitCost[recipe.yieldUnit]}</dt>
          <dd className="font-bold text-primary">{formatRecipeUnitCost(recipe.costPerYieldUnit, recipe.yieldUnit)}</dd>
        </div>
        <p className="text-[11px] text-muted-foreground">{t.ingredientCount(recipe.itemCount)}</p>
      </dl>
      <div className="mt-auto flex gap-2">
        <Link
          to={`/recipes/${recipe.id}`}
          className={cn(buttonVariants({ variant: archived ? "outline" : undefined }), "flex-1")}
        >
          {archived ? t.viewSheetShort : t.viewSheet}
        </Link>
        {archived ? (
          <Button variant="outline" disabled={restoring} onClick={() => onRestore(recipe)}>
            <RotateCcw aria-hidden className="size-4" />
            {t.actions.restore}
          </Button>
        ) : (
          <Link
            to={`/recipes/${recipe.id}/edit`}
            aria-label={t.editLabel(recipe.name)}
            className={cn(buttonVariants({ variant: "outline" }), "px-3")}
          >
            <Pencil aria-hidden className="size-4" />
          </Link>
        )}
      </div>
    </li>
  );
}

/** Desktop: roomy cards in a grid, with the actions on the card itself. */
export function RecipeGrid(props: ListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {props.items.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} {...props} />
      ))}
    </ul>
  );
}

function CompactCard({ recipe, onRestore, restoring }: Omit<ListProps, "items" | "onArchive"> & { recipe: RecipeSummary }) {
  const archived = !recipe.active;
  const warned = recipe.active && recipe.archivedIngredientCount > 0;
  return (
    // the title link is stretched over the whole card; the restore button sits above it
    <li
      className={cn(
        "relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm",
        warned && "border-amber-300",
        archived && "opacity-80",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryTag>{recipe.category.name}</CategoryTag>
          {archived && <ArchivedTag />}
        </div>
        {archived ? (
          <Button size="sm" variant="outline" className="relative z-10" disabled={restoring} onClick={() => onRestore(recipe)}>
            <RotateCcw aria-hidden className="size-4" />
            {t.actions.restore}
          </Button>
        ) : (
          <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className={cn("text-base font-semibold leading-tight", archived && "line-through")}>
          <Link to={`/recipes/${recipe.id}`} className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">
            {recipe.name}
          </Link>
        </h2>
        <Facts recipe={recipe} />
        <p className="text-[11px] text-muted-foreground">{t.ingredientCount(recipe.itemCount)}</p>
      </div>
      {warned && <ArchivedIngredientsAlert count={recipe.archivedIngredientCount} />}
      <div className="flex items-end justify-between gap-3 border-t pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t.batchCostShort}</p>
          <p className="text-base font-bold">{formatMoney(recipe.totalCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t.unitCost[recipe.yieldUnit]}
          </p>
          <p className="text-base font-bold text-primary">{formatRecipeUnitCost(recipe.costPerYieldUnit, recipe.yieldUnit)}</p>
        </div>
      </div>
    </li>
  );
}

/** Mobile and tablet: compact cards, the whole card opens the sheet. */
export function RecipeCompactList({ items, onRestore, restoring }: ListProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((recipe) => (
        <CompactCard key={recipe.id} recipe={recipe} onRestore={onRestore} restoring={restoring} />
      ))}
    </ul>
  );
}