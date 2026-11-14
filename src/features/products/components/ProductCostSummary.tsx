import { RefreshCw } from "lucide-react";
import type { ProductSimulation } from "@/api/types";
import { messages } from "@/i18n/messages";
import { formatMoney } from "@/lib/format";

const t = messages.productForm.summary;

interface Props {
  /** The server's answer for what is typed right now; undefined while the form cannot be priced. */
  data: ProductSimulation | undefined;
  /** True when the form is complete enough to price (so "waiting" can say what is missing). */
  complete: boolean;
  isFetching: boolean;
  isError: boolean;
}

/** Every number comes from POST /products/simulation: the screen formats, it never calculates. */
export function ProductCostSummary({ data, complete, isFetching, isError }: Props) {
  return (
    <section aria-label={t.title} aria-busy={isFetching} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.title}</h2>
        <span className="flex items-center gap-1 text-xs text-[#00523b]">
          <RefreshCw aria-hidden className={isFetching ? "size-3 animate-spin" : "size-3"} />
          {isFetching ? t.updating : t.live}
        </span>
      </div>

      <div aria-live="polite" className="flex flex-col gap-3">
        <div className="rounded-xl bg-[#f5f3f0] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{t.total}</p>
          <p className="text-2xl font-bold text-primary">{data ? formatMoney(data.cost.totalCost) : "—"}</p>
        </div>
        <dl className="flex flex-col gap-1 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{t.recipeCost}</dt>
            <dd className="font-medium">{data ? formatMoney(data.cost.recipeCost) : "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{t.extrasCost}</dt>
            <dd className="font-medium">{data ? formatMoney(data.cost.extrasCost) : "—"}</dd>
          </div>
        </dl>
        {isError && (
          <p role="alert" className="text-xs text-destructive">
            {t.error}
          </p>
        )}
        {!isError && !data && !complete && <p className="text-xs text-muted-foreground">{t.waiting}</p>}
      </div>
    </section>
  );
}