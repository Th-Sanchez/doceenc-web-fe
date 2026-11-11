import { RefreshCw } from "lucide-react";
import type { BaseUnit, RecipeSimulation } from "@/api/types";
import { messages } from "@/i18n/messages";
import { formatMoney, formatQuantity } from "@/lib/format";
import { formatRecipeUnitCostWithUnit } from "../format";

const t = messages.recipeForm.summary;

interface Props {
  /** The server's answer for what is typed right now; undefined while the form cannot be priced. */
  data: RecipeSimulation | undefined;
  /** True when the form is complete enough to price (so "waiting" can say what is missing). */
  complete: boolean;
  isFetching: boolean;
  isError: boolean;
  yieldUnit: BaseUnit;
  yieldQuantity: number | undefined;
}

/** Every number here comes from POST /recipes/simulation: the screen formats, it never calculates. */
export function CostSummary({ data, complete, isFetching, isError, yieldUnit, yieldQuantity }: Props) {
  return (
    <section aria-label={t.title} aria-busy={isFetching} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.title}</h2>
        <span className="flex items-center gap-1 text-xs text-[#00523b]">
          <RefreshCw aria-hidden className={isFetching ? "size-3 animate-spin" : "size-3"} />
          {isFetching ? t.updating : messages.recipeForm.liveCost}
        </span>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-muted-foreground">{t.total}</span>
          <span className="font-bold">{data ? formatMoney(data.totalCost) : "—"}</span>
        </div>
        <div className="rounded-xl bg-[#f5f3f0] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t.unit}</p>
          <p className="text-2xl font-bold text-primary">
            {data ? formatRecipeUnitCostWithUnit(data.costPerYieldUnit, yieldUnit) : "—"}
          </p>
        </div>
        {isError && (
          <p role="alert" className="text-xs text-destructive">
            {t.error}
          </p>
        )}
        {!isError && data && yieldQuantity !== undefined && (
          <p className="text-xs text-muted-foreground">
            {t.calculatedBy(formatMoney(data.totalCost), formatQuantity(yieldQuantity, yieldUnit))}
          </p>
        )}
        {!isError && !data && !complete && <p className="text-xs text-muted-foreground">{t.waiting}</p>}
      </div>
    </section>
  );
}