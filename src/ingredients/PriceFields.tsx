import { Check } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import type { BaseUnit } from "@/api/types";
import { Field } from "@/components/ui/field";
import { fieldProps } from "@/components/ui/field-props";
import { Input } from "@/components/ui/input";
import { messages } from "@/i18n/messages";
import { parseDecimal, toInputText } from "@/lib/decimal";
import { formatQuantity, toIsoDate } from "@/lib/format";

export type PriceFieldName = "packagePrice" | "packageQuantity" | "purchasedOn";

/** Literal presets in the base unit: no conversion happens anywhere. */
const QUICK_FILLS: Record<BaseUnit, number[]> = {
  GRAM: [395, 1000, 5000],
  MILLILITER: [200, 1000],
  UNIT: [12, 50],
};

interface Props {
  unit: BaseUnit;
  register: (name: PriceFieldName) => UseFormRegisterReturn;
  errors: Partial<Record<PriceFieldName, string>>;
  quantityText: string;
  onQuickFill: (text: string) => void;
}

export function PriceFields({ unit, register, errors, quantityText, onQuickFill }: Props) {
  const t = messages.ingredientForm;
  const quantity = parseDecimal(quantityText ?? "");

  return (
    <>
      <Field id="packagePrice" label={t.packagePrice} hint={messages.form.required} error={errors.packagePrice}>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            className="pl-10"
            {...fieldProps("packagePrice", errors.packagePrice)}
            {...register("packagePrice")}
          />
        </div>
      </Field>

      <Field id="packageQuantity" label={t.packageQuantity} hint={messages.form.required} error={errors.packageQuantity}>
        <div className="relative">
          <Input
            inputMode="decimal"
            autoComplete="off"
            className="pr-12"
            {...fieldProps("packageQuantity", errors.packageQuantity)}
            {...register("packageQuantity")}
          />
          <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {messages.units[unit]}
          </span>
        </div>
        {quantity !== null && quantity > 0 && (
          <p className="flex items-center gap-1 text-xs text-[#00523b]">
            <Check aria-hidden className="size-3" />
            {t.quantityRead(formatQuantity(quantity, unit))}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t.quickFill}</span>
          {QUICK_FILLS[unit].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onQuickFill(toInputText(value))}
              className="rounded-md bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/70"
            >
              {formatQuantity(value, unit)}
            </button>
          ))}
        </div>
      </Field>

      <Field id="purchasedOn" label={t.purchasedOn} hint={t.purchasedOnHint} error={errors.purchasedOn}>
        <Input
          type="date"
          max={toIsoDate(new Date())}
          {...fieldProps("purchasedOn", errors.purchasedOn)}
          {...register("purchasedOn")}
        />
      </Field>
    </>
  );
}