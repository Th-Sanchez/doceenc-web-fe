import { Archive, Pencil, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Recipe } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messageForError, messages } from "@/i18n/messages";
import { formatMoney, formatQuantity } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { ArchiveRecipeDialog } from "../components/ArchiveRecipeDialog";
import { RecipeGate } from "../components/RecipeGate";
import { RecipeSheetList, RecipeSheetTable } from "../components/RecipeSheetItems";
import { formatMinutes, formatRecipeUnitCostWithUnit } from "../format";
import { useRestoreRecipe } from "../queries";

const t = messages.recipeSheet;

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-bold">{value}</dd>
    </div>
  );
}

function RecipeSheet({ recipe }: { recipe: Recipe }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const restore = useRestoreRecipe();
  const [archiving, setArchiving] = useState(false);

  const yieldText = formatQuantity(recipe.yieldQuantity, recipe.yieldUnit);
  const archivedCount = recipe.items.filter((item) => !item.ingredient.active).length;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label={t.breadcrumb} className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
        <Link to="/recipes" className="hover:text-foreground">
          {t.breadcrumbRoot}
        </Link>
        <span aria-hidden>/</span>
        <span aria-current="page" className="font-medium text-foreground">
          {recipe.name}
        </span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#efeeeb] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#554245]">
              {recipe.category.name}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                recipe.active ? "bg-[#d9eee5] text-[#00523b]" : "border border-amber-300 bg-amber-50 text-amber-800",
              )}
            >
              {recipe.active ? t.statusActive : t.statusArchived}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{recipe.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {recipe.active ? (
            <>
              <Button variant="outline" onClick={() => setArchiving(true)}>
                <Archive aria-hidden className="size-4" />
                {t.archive}
              </Button>
              <Link to={`/recipes/${recipe.id}/edit`} className={buttonVariants()}>
                <Pencil aria-hidden className="size-4" />
                {t.edit}
              </Link>
            </>
          ) : (
            <Button variant="outline" onClick={() => restore.mutate(recipe.id)} disabled={restore.isPending}>
              <RotateCcw aria-hidden className="size-4" />
              {restore.isPending ? t.restoring : t.restore}
            </Button>
          )}
        </div>
      </header>

      {!recipe.active && (
        <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t.archivedBanner}
        </p>
      )}
      {recipe.active && archivedCount > 0 && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {messages.recipes.archivedIngredients(archivedCount)}
        </p>
      )}
      {restore.isError && (
        <p role="alert" className="text-sm text-destructive">
          {messageForError(restore.error)}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t.kpi.yield} value={yieldText} />
        <Kpi label={t.kpi.prep} value={recipe.prepTimeMinutes === null ? t.noValue : formatMinutes(recipe.prepTimeMinutes)} />
        <Kpi label={t.kpi.shelfLife} value={recipe.shelfLifeDays === null ? t.noValue : t.days(recipe.shelfLifeDays)} />
        <Kpi label={t.kpi.items} value={t.itemsCount(recipe.items.length)} />
      </dl>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section aria-labelledby="composition-title" className="order-2 flex flex-col gap-3 lg:order-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="composition-title" className="text-lg font-semibold">
                {t.composition.title}
              </h2>
              <p className="text-xs text-muted-foreground">{t.composition.subtitle(yieldText)}</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t.composition.count(recipe.items.length)}
            </span>
          </div>
          {isDesktop ? <RecipeSheetTable items={recipe.items} /> : <RecipeSheetList items={recipe.items} />}
        </section>

        <aside aria-label={t.summary.title} className="order-1 flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:order-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t.summary.eyebrow}</p>
            <h2 className="text-lg font-semibold">{t.summary.title}</h2>
          </div>
          <div className="rounded-xl bg-[#f5f3f0] p-3">
            <p className="text-xs text-muted-foreground">{t.summary.total}</p>
            <p className="text-2xl font-bold">{formatMoney(recipe.totalCost)}</p>
          </div>
          <div className="rounded-xl bg-[#f5f3f0] p-3">
            <p className="text-xs text-muted-foreground">{t.summary.unit}</p>
            <p className="text-2xl font-bold text-primary">
              {formatRecipeUnitCostWithUnit(recipe.costPerYieldUnit, recipe.yieldUnit)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.summary.calculatedBy(formatMoney(recipe.totalCost), yieldText)}
            </p>
          </div>
        </aside>
      </div>

      <ArchiveRecipeDialog recipe={archiving ? recipe : null} onClose={() => setArchiving(false)} />
    </div>
  );
}

export function RecipeDetailPage() {
  return <RecipeGate>{(recipe) => <RecipeSheet recipe={recipe} />}</RecipeGate>;
}