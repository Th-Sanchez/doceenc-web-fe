import type { UseFormRegisterReturn } from "react-hook-form";
import type { ChannelPricing } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { messages } from "@/i18n/messages";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BAR, StatusChip } from "./StatusChip";

const t = messages.productForm.channel;

interface Props {
  fieldName: "retailPrice" | "wholesalePrice";
  title: string;
  subtitle: string;
  inputProps: UseFormRegisterReturn;
  error?: string;
  /** The server's answer for this channel; undefined until the first simulation arrives. */
  pricing: ChannelPricing | undefined;
  onUseSuggested: (price: number) => void;
}

/** The price input of one channel with its live margin, status and suggested price (all from the server). */
export function ChannelPanel({ fieldName, title, subtitle, inputProps, error, pricing, onUseSuggested }: Props) {
  const { marginPercent, grossProfit, suggestedPrice } = pricing ?? {};
  const showSuggestion = pricing !== undefined && pricing.status !== "ON_TARGET" && suggestedPrice != null;

  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {pricing && <StatusChip status={pricing.status} />}
      </div>

      <Field id={fieldName} label={t.price} hint={messages.form.optional} error={error}>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            inputMode="decimal"
            autoComplete="off"
            className="h-10 rounded-xl border-0 bg-[#f5f3f0] pl-10 text-sm sm:h-12.5"
            {...fieldProps(fieldName, error)}
            {...inputProps}
          />
        </div>
      </Field>

      {pricing && pricing.status !== "NO_PRICE" && marginPercent != null && grossProfit != null && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t.grossProfit}</span>
            <span className="font-bold">{formatMoney(grossProfit)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t.margin}</span>
            <span className={cn("font-bold", pricing.status === "LOSS" && "text-destructive")}>
              {formatPercent(marginPercent)}
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-[#e5e2de]" aria-hidden>
            <div
              className={cn("h-full rounded-full", BAR[pricing.status])}
              style={{ width: `${Math.min(Math.max(marginPercent, 0), 100)}%` }}
            />
            <span
              className="absolute -top-0.5 h-3 w-0.5 bg-foreground/70"
              style={{ left: `${Math.min(Math.max(pricing.targetMarginPercent, 0), 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{t.target(formatPercent(pricing.targetMarginPercent))}</p>
          {pricing.status === "LOSS" && <p className="text-xs text-destructive">{t.lossHint}</p>}
        </div>
      )}

      {pricing?.status === "NO_PRICE" && <p className="text-xs text-muted-foreground">{t.noPriceHint}</p>}

      {showSuggestion && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f5f3f0] p-2 pl-3">
          <p className="text-xs">{t.suggested(formatMoney(suggestedPrice))}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => onUseSuggested(suggestedPrice)}>
            {t.useSuggested}
          </Button>
        </div>
      )}
    </section>
  );
}