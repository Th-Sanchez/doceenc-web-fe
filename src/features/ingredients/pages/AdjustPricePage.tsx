import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { Ingredient } from "@/api/types";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { messages } from "@/i18n/messages";
import { toInputText } from "@/lib/decimal";
import { applyServerError, type ServerErrorMapping } from "@/lib/form-errors";
import { formatDate, formatLastPurchase, formatMoney, formatQuantity, formatUnitCost, toIsoDate } from "@/lib/format";
import { IngredientGate } from "../components/IngredientGate";
import { toPriceBody } from "../payloads";
import { PriceChart } from "../components/PriceChart";
import { PriceFields } from "../components/PriceFields";
import { useIngredientPrices, useRegisterPurchase } from "../queries";
import { type PriceFormInput, type PriceFormValues, priceSchema } from "../schemas";
import { VariationBadge } from "../components/VariationBadge";

const SERVER_ERRORS = {
  fields: {
    packagePrice: "packagePrice",
    packageQuantity: "packageQuantity",
    purchasedOn: "purchasedOn",
  },
  codes: { PURCHASE_DATE_IN_FUTURE: "purchasedOn", PRICE_OUT_OF_RANGE: "packageQuantity" },
} satisfies ServerErrorMapping<PriceFormInput>;

function PriceHistory({ ingredient }: { ingredient: Ingredient }) {
  const t = messages.priceForm;
  const history = useIngredientPrices(ingredient.id);

  if (history.isPending) return <p role="status">{messages.loading}</p>;
  if (history.isError) return <p role="alert" className="text-sm text-destructive">{t.historyError}</p>;

  const entries = history.data;
  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 id="history-title" className="font-semibold">{t.history}</h2>
        <span className="text-xs text-muted-foreground">{t.records(entries.length)}</span>
      </div>
      {/* the API returns newest first; the chart reads oldest to newest */}
      <PriceChart values={[...entries].reverse().map((entry) => entry.unitPrice)} label={t.chartLabel} />
      <ol className="flex flex-col divide-y">
        {entries.map((entry, index) => (
          <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <span className="flex items-center gap-2">
              {formatDate(entry.purchasedOn)}
              {index === 0 && (
                <span className="rounded bg-[#f9d8d2] px-1.5 py-0.5 text-[10px] font-semibold text-[#765d58]">{t.current}</span>
              )}
            </span>
            <span className="text-muted-foreground">
              {formatMoney(entry.packagePrice)} / {formatQuantity(entry.packageQuantity, ingredient.baseUnit)}
            </span>
            <span className="font-semibold text-primary">{formatUnitCost(entry.unitPrice, ingredient.baseUnit)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AdjustPriceForm({ ingredient }: { ingredient: Ingredient }) {
  const t = messages.priceForm;
  const navigate = useNavigate();
  const register_ = useRegisterPurchase();
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, setError, formState: { errors } } = useForm<
    PriceFormInput,
    unknown,
    PriceFormValues
  >({
    resolver: zodResolver(priceSchema),
    defaultValues: {
      packagePrice: toInputText(ingredient.packagePrice, 2),
      packageQuantity: toInputText(ingredient.packageQuantity),
      purchasedOn: toIsoDate(new Date()),
    },
  });
  const quantityText = watch("packageQuantity");

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    register_.mutate(
      { id: ingredient.id, ...toPriceBody(values, ingredient.baseUnit) },
      {
        onSuccess: () => navigate("/ingredients"),
        onError: (error) => setFormError(applyServerError(error, setError, SERVER_ERRORS)),
      },
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/ingredients" className="flex items-center gap-1 text-sm font-semibold text-primary">
          <ArrowLeft aria-hidden className="size-4" />
          {messages.ingredientForm.back}
        </Link>
        <h1 className="font-display text-2xl font-bold text-primary">{t.title}</h1>
        <p className="text-sm">
          <span className="font-semibold">{ingredient.name}</span>
          <span className="text-muted-foreground">
            {" "}
            • {[ingredient.brandSupplier, ingredient.category.name].filter(Boolean).join(" • ")}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f9d8d2]/40 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{t.currentCost}</p>
          <p className="text-2xl font-bold text-primary">{formatUnitCost(ingredient.unitPrice, ingredient.baseUnit)}</p>
          {ingredient.lastPurchasedOn && (
            <p className="text-xs text-muted-foreground">
              {messages.ingredients.lastPurchase}: {formatLastPurchase(ingredient.lastPurchasedOn)}
            </p>
          )}
        </div>
        <VariationBadge value={ingredient.variationPercent} />
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 rounded-xl border bg-card p-5">
        <PriceFields
          unit={ingredient.baseUnit}
          register={register}
          errors={{
            packagePrice: errors.packagePrice?.message,
            packageQuantity: errors.packageQuantity?.message,
            purchasedOn: errors.purchasedOn?.message,
          }}
          quantityText={quantityText}
          onQuickFill={(text) => setValue("packageQuantity", text, { shouldValidate: true, shouldDirty: true })}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to="/ingredients" className={buttonVariants({ variant: "outline" })}>
            {messages.form.cancel}
          </Link>
          <Button type="submit" disabled={register_.isPending}>
            {register_.isPending ? t.submitting : t.submit}
          </Button>
        </div>
      </form>

      <PriceHistory ingredient={ingredient} />
    </div>
  );
}

export function AdjustPricePage() {
  return <IngredientGate>{(ingredient) => <AdjustPriceForm ingredient={ingredient} />}</IngredientGate>;
}