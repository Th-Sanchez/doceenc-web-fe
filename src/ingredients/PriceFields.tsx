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
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary">
            R$
          </span>
          <Input
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            className="h-[50px] rounded-xl border-0 bg-[#f5f3f0] pl-10 text-sm"
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
            className="h-[50px] rounded-xl border-0 bg-[#f5f3f0] pr-12 text-sm"
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
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="whitespace-nowrap text-[10px] text-muted-foreground">{t.quickFill}</span>
          {QUICK_FILLS[unit].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onQuickFill(toInputText(value))}
              className="whitespace-nowrap rounded-md bg-[#efeeeb] px-1.5 py-1 text-[10px] font-medium hover:bg-muted"
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
          className="h-[50px] rounded-xl border-0 bg-[#f5f3f0] text-sm"
          {...fieldProps("purchasedOn", errors.purchasedOn)}
          {...register("purchasedOn")}
        />
      </Field>
    </>
  );
}