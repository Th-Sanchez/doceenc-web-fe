import { Trash2 } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import type { Ingredient } from "@/api/types";
import { Input } from "@/components/ui/input";
import { messages } from "@/i18n/messages";
import { formatMoney, formatUnitCost } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CreateRecipeFormInput } from "../schemas";

const t = messages.recipeForm;

/** What a row needs to show about its ingredient: the catalog entry or the one embedded in the recipe. */
export type IngredientInfo = Pick<Ingredient, "id" | "name" | "brandSupplier" | "baseUnit" | "active" | "unitPrice">;

interface Props {
  index: number;
  /** Undefined while the catalog loads. */
  info: IngredientInfo | undefined;
  register: UseFormRegister<CreateRecipeFormInput>;
  error?: string;
  /** Cost of this line as the server priced it; undefined until the first answer. */
  cost: number | undefined;
  onRemove: () => void;
}

export function RecipeItemRow({ index, info, register, error, cost, onRemove }: Props) {
  const name = info?.name ?? messages.loading;
  const archived = info !== undefined && !info.active;
  const inputId = `item-${index}-quantity`;

  return (
    <li className={cn("rounded-xl border bg-card p-3 shadow-sm", archived && "border-amber-300 bg-amber-50/50")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {name}
            {info?.brandSupplier && <span className="font-normal text-muted-foreground"> · {info.brandSupplier}</span>}
          </p>
          {archived && (
            <span className="mt-1 inline-block rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
              {t.archivedTag}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.removeItem(name)}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      </div>

      {info && <p className="mt-1 text-xs text-muted-foreground">{t.baseCost(formatUnitCost(info.unitPrice, info.baseUnit))}</p>}

      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-[#f5f3f0] p-2">
        <label htmlFor={inputId} className="flex items-center gap-2 text-xs text-muted-foreground">
          {t.itemQuantityLabel}
          <Input
            id={inputId}
            inputMode="decimal"
            autoComplete="off"
            aria-label={t.itemQuantity(name)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="h-9 w-24 bg-card px-2 text-sm"
            {...register(`items.${index}.quantity`)}
          />
          {info && <span aria-hidden>{messages.units[info.baseUnit]}</span>}
        </label>
        <p className="text-xs text-muted-foreground">
          {t.itemCost}: <span className="text-sm font-bold text-primary">{cost === undefined ? "—" : formatMoney(cost)}</span>
        </p>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}